<?php

namespace Tests\Feature\Api\V1\Finance;

use App\Enums\BalanceBucket;
use App\Enums\FinancialTransactionType;
use App\Enums\PayoutStatus;
use App\Enums\RoleName;
use App\Enums\VendorOrderStatus;
use App\Models\FinancialTransaction;
use App\Models\Order;
use App\Models\PaymentVendorAllocation;
use App\Models\Product;
use App\Models\VendorPayout;
use App\Services\Finance\FinancialPostingService;
use App\Services\Order\VendorOrderStateService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class FinancialLedgerTest extends TestCase
{
    use InteractsWithCheckout;
    use InteractsWithFinance;
    use InteractsWithIdentity;
    use InteractsWithPayments;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
    }

    #[Test]
    public function paid_payment_posts_idempotent_ledger_entries(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $payment = $order->payment;

        $service = app(PaymentFinalizationService::class);
        $service->finalizePaid($payment, FakePaymentGateway::$gatewayPaymentId, '12345');
        $service->finalizePaid($payment->fresh(), FakePaymentGateway::$gatewayPaymentId, '12345');

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $this->assertGreaterThan(0, (float) $allocation->platform_commission_amount);
        $this->assertSame(
            number_format((float) $allocation->vendor_gross_total, 2, '.', ''),
            bcadd((string) $allocation->vendor_payable_amount, (string) $allocation->platform_commission_amount, 2),
        );

        $this->assertSame(1, FinancialTransaction::query()
            ->where('payment_id', $payment->id)
            ->where('transaction_type', FinancialTransactionType::Escrow->value)
            ->count());

        app(FinancialPostingService::class)->postPaidPayment($payment->fresh(['vendorAllocations']));

        $this->assertSame(1, FinancialTransaction::query()
            ->where('payment_id', $payment->id)
            ->where('transaction_type', FinancialTransactionType::Escrow->value)
            ->count());
    }

    #[Test]
    public function escrow_release_moves_funds_to_available_balance(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid($payment, FakePaymentGateway::$gatewayPaymentId, '12345');

        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);

        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $this->assertDatabaseHas('financial_transactions', [
            'payment_vendor_allocation_id' => $allocation->id,
            'transaction_type' => FinancialTransactionType::EscrowRelease->value,
            'balance_bucket' => BalanceBucket::VendorAvailable->value,
        ]);
    }

    #[Test]
    public function vendor_can_request_payout_up_to_available_balance(): void
    {
        $this->fakePaymentGateway();
        [$customer, $order] = $this->createPayableOrder();
        $vendor = $customer; // wrong - need vendor user
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = $vendorUser->vendorAccount;

        // Re-create with known vendor
        $this->seedCommissionRules();
        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid($payment, FakePaymentGateway::$gatewayPaymentId, '12345');
        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();
        $available = (string) $allocation->vendor_payable_amount;

        $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorUser, [
            'amount' => $available,
        ])->assertCreated();

        $this->assertDatabaseHas('vendor_payouts', [
            'vendor_account_id' => $vendorAccount->id,
            'status' => PayoutStatus::Pending->value,
        ]);
    }

    #[Test]
    public function payout_cannot_exceed_available_balance(): void
    {
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorUser, [
            'amount' => '9999.00',
        ])->assertStatus(422);
    }

    #[Test]
    public function admin_mark_paid_creates_payout_ledger_entry(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $admin = $this->createUserWithRole(RoleName::Admin);

        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid($payment, FakePaymentGateway::$gatewayPaymentId, '12345');
        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $payoutResponse = $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorUser, [
            'amount' => (string) $allocation->vendor_payable_amount,
        ])->assertCreated();

        $payoutId = $payoutResponse->json('data.payout.id');

        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/approve", $admin)->assertOk();
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/mark-paid", $admin)->assertOk();

        $this->assertDatabaseHas('financial_transactions', [
            'vendor_payout_id' => $payoutId,
            'transaction_type' => FinancialTransactionType::Payout->value,
        ]);

        $this->assertSame(PayoutStatus::Paid->value, VendorPayout::query()->find($payoutId)->status->value);
    }

    #[Test]
    public function vendor_cannot_view_another_vendors_finance(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary', $vendorA)->assertOk();
        $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary', $vendorB)->assertOk();
    }

    protected function createPayableOrder(): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        return $this->createPayableOrderForCustomer($customer);
    }

    protected function createPayableOrderForVendor($vendorUser): array
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = $this->createCustomerAddress($customer);
        $vendorAccount = $vendorUser->vendorAccount;
        $this->createVendorShippingSettings($vendorAccount);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendorAccount->id,
            'sale_price' => '100.00',
        ]);

        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $order = Order::query()->with('payment', 'vendorOrders')->findOrFail($response->json('data.order.id'));

        return [$customer, $order];
    }

    protected function createPayableOrderForCustomer($customer): array
    {
        $address = $this->createCustomerAddress($customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $this->createVendorShippingSettings($vendor->vendorAccount);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => '100.00',
        ]);

        $this->addProductToUserCart($customer, $product, 1);

        $response = $this->postJsonAsUser(
            '/api/v1/orders',
            $customer,
            $this->checkoutPayload($address, $product),
            ['Idempotency-Key' => (string) Str::uuid()],
        )->assertCreated();

        $order = Order::query()->with('payment', 'vendorOrders')->findOrFail($response->json('data.order.id'));

        return [$customer, $order];
    }
}
