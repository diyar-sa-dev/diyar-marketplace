<?php

namespace Tests\Feature\Api\V1\Finance;

use App\Enums\CommissionScope;
use App\Enums\FinancialTransactionType;
use App\Enums\PayoutStatus;
use App\Enums\RoleName;
use App\Enums\VendorOrderStatus;
use App\Models\CommissionRule;
use App\Models\FinancialTransaction;
use App\Models\Order;
use App\Models\PaymentVendorAllocation;
use App\Models\Product;
use App\Models\VendorPayout;
use App\Services\Finance\CommissionResolver;
use App\Services\Finance\EscrowReleaseService;
use App\Services\Order\VendorOrderStateService;
use App\Services\Payments\PaymentAllocationSnapshotService;
use App\Services\Payments\PaymentApplicationService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use InvalidArgumentException;
use PHPUnit\Framework\Attributes\Test;
use RuntimeException;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\Fakes\FakePaymentGateway;
use Tests\TestCase;

class FinancialStage95AuditTest extends TestCase
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
    public function commission_snapshot_is_frozen_after_rule_and_price_changes(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        [$customer, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();
        $product = $vendorOrder->items->first()->product;

        app(PaymentApplicationService::class)->initiate(
            $order->fresh(['payment']),
            $customer,
            'imm-freeze-key',
        );

        $allocation = PaymentVendorAllocation::query()
            ->where('payment_id', $payment->id)
            ->firstOrFail();

        $this->assertSame('10.00', number_format((float) $allocation->platform_commission_amount, 2, '.', ''));

        CommissionRule::query()
            ->where('scope', CommissionScope::Global)
            ->whereNull('scope_id')
            ->update(['rate_percent' => '20.00']);

        $product->update(['sale_price' => '200.00']);

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment->fresh(),
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $allocation->refresh();

        $this->assertSame('10.00', number_format((float) $allocation->platform_commission_amount, 2, '.', ''));

        $commissionLedger = FinancialTransaction::query()
            ->where('payment_id', $payment->id)
            ->where('transaction_type', FinancialTransactionType::PlatformCommission->value)
            ->firstOrFail();

        $this->assertSame('10.00', number_format((float) $commissionLedger->amount, 2, '.', ''));
    }

    #[Test]
    public function vendor_commission_rule_overrides_global_rule(): void
    {
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $vendorAccount = $vendorUser->vendorAccount;

        CommissionRule::query()->create([
            'scope' => CommissionScope::Vendor,
            'scope_id' => $vendorAccount->id,
            'rate_percent' => '5.00',
            'is_active' => true,
        ]);

        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $vendorOrder = $order->vendorOrders->first();

        $resolution = app(CommissionResolver::class)->resolveForVendorOrder($vendorOrder);

        $this->assertSame('5.00', $resolution->ratePercent);
        $this->assertSame('5.00', $resolution->commissionAmount);
    }

    #[Test]
    public function invalid_commission_rate_is_rejected(): void
    {
        CommissionRule::query()
            ->where('scope', CommissionScope::Global)
            ->whereNull('scope_id')
            ->update(['rate_percent' => '150.00']);

        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;

        $this->expectException(InvalidArgumentException::class);

        app(PaymentAllocationSnapshotService::class)->snapshotForPayment($payment);
    }

    #[Test]
    public function duplicate_escrow_release_is_idempotent(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $escrowService = app(EscrowReleaseService::class);
        $escrowService->releaseForVendorOrder($vendorOrder->fresh());
        $escrowService->releaseForVendorOrder($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $this->assertSame(2, FinancialTransaction::query()
            ->where('payment_vendor_allocation_id', $allocation->id)
            ->where('transaction_type', FinancialTransactionType::EscrowRelease->value)
            ->count());
    }

    #[Test]
    public function financial_transactions_are_immutable(): void
    {
        $this->fakePaymentGateway();
        [, $order] = $this->createPayableOrder();
        $payment = $order->payment;

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $transaction = FinancialTransaction::query()->firstOrFail();

        $this->expectException(RuntimeException::class);
        $transaction->update(['amount' => '999.00']);
    }

    #[Test]
    public function vendor_cannot_cancel_another_vendors_payout(): void
    {
        $this->fakePaymentGateway();
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);

        [, $order] = $this->createPayableOrderForVendor($vendorA);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $this->createVendorBankAccount($vendorA->vendorAccount);

        $payoutResponse = $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorA, [
            'amount' => (string) $allocation->vendor_payable_amount,
        ])->assertCreated();

        $payoutId = $payoutResponse->json('data.payout.id');

        $this->postJsonAsUser("/api/v1/dashboard/vendor/finance/payouts/{$payoutId}/cancel", $vendorB)
            ->assertForbidden();
    }

    #[Test]
    public function vendor_cannot_mark_payout_paid(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $admin = $this->createUserWithRole(RoleName::Admin);

        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $this->createVendorBankAccount($vendorUser->vendorAccount);

        $payoutResponse = $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorUser, [
            'amount' => (string) $allocation->vendor_payable_amount,
        ])->assertCreated();

        $payoutId = $payoutResponse->json('data.payout.id');
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/approve", $admin)->assertOk();

        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/mark-paid", $vendorUser)
            ->assertForbidden();
    }

    #[Test]
    public function duplicate_mark_paid_is_idempotent_on_ledger(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $admin = $this->createUserWithRole(RoleName::Admin);

        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $this->createVendorBankAccount($vendorUser->vendorAccount);

        $payoutResponse = $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorUser, [
            'amount' => (string) $allocation->vendor_payable_amount,
        ])->assertCreated();

        $payoutId = $payoutResponse->json('data.payout.id');
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/approve", $admin)->assertOk();
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/mark-paid", $admin)->assertOk();
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/mark-paid", $admin)->assertOk();

        $this->assertSame(1, FinancialTransaction::query()
            ->where('vendor_payout_id', $payoutId)
            ->where('transaction_type', FinancialTransactionType::Payout->value)
            ->count());

        $this->assertSame(PayoutStatus::Paid->value, VendorPayout::query()->find($payoutId)->status->value);
    }

    #[Test]
    public function cancelled_vendor_order_cannot_be_marked_delivered(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $vendorOrder = $order->vendorOrders->first();

        $vendorOrder->update(['status' => VendorOrderStatus::Cancelled]);

        $this->expectException(InvalidArgumentException::class);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());
    }

    #[Test]
    public function derived_balance_reflects_escrow_release_and_payout(): void
    {
        $this->fakePaymentGateway();
        $vendorUser = $this->createUserWithRole(RoleName::Vendor);
        $admin = $this->createUserWithRole(RoleName::Admin);

        [, $order] = $this->createPayableOrderForVendor($vendorUser);
        $payment = $order->payment;
        $vendorOrder = $order->vendorOrders->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            $payment,
            FakePaymentGateway::$gatewayPaymentId,
            '12345',
        );

        $summaryAfterPayment = $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary', $vendorUser)
            ->assertOk()
            ->json('data.summary');

        $this->assertGreaterThan(0, (float) $summaryAfterPayment['pending_escrow']);
        $this->assertSame('0.00', $summaryAfterPayment['available_balance']);

        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);
        app(VendorOrderStateService::class)->markDelivered($vendorOrder->fresh());

        $allocation = PaymentVendorAllocation::query()->where('payment_id', $payment->id)->firstOrFail();

        $summaryAfterRelease = $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary', $vendorUser)
            ->assertOk()
            ->json('data.summary');

        $this->assertSame('0.00', $summaryAfterRelease['pending_escrow']);
        $this->assertSame(
            number_format((float) $allocation->vendor_payable_amount, 2, '.', ''),
            $summaryAfterRelease['available_balance'],
        );

        $this->createVendorBankAccount($vendorUser->vendorAccount);

        $this->postJsonAsUser('/api/v1/dashboard/vendor/finance/payouts', $vendorUser, [
            'amount' => (string) $allocation->vendor_payable_amount,
        ])->assertCreated();

        $payoutId = VendorPayout::query()->where('vendor_account_id', $vendorUser->vendorAccount->id)->value('id');
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/approve", $admin)->assertOk();
        $this->postJsonAsUser("/api/v1/admin/payouts/{$payoutId}/mark-paid", $admin)->assertOk();

        $summaryAfterPayout = $this->getJsonAsUser('/api/v1/dashboard/vendor/finance/summary', $vendorUser)
            ->assertOk()
            ->json('data.summary');

        $this->assertSame('0.00', $summaryAfterPayout['available_balance']);
        $this->assertSame(
            number_format((float) $allocation->vendor_payable_amount, 2, '.', ''),
            $summaryAfterPayout['paid_out'],
        );
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

        $order = Order::query()->with('payment', 'vendorOrders.items.product')->findOrFail($response->json('data.order.id'));

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
