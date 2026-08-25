<?php

namespace Tests\Feature\Loyalty;

use App\Enums\AdminPermission;
use App\Enums\LoyaltyTransactionType;
use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Events\Domain\PaymentSucceeded;
use App\Events\Domain\ReturnUpdated;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Permission;
use App\Models\Product;
use App\Models\ReturnRequest;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorOrder;
use App\Models\VendorReturnPolicy;
use App\Services\Admin\AdminPermissionService;
use App\Services\Admin\AdminRolePermissionService;
use App\Services\Loyalty\LoyaltyLedgerService;
use App\Services\Loyalty\LoyaltyRuleService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class LoyaltyHardeningTest extends TestCase
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
        $this->fakePaymentGateway();
        $this->configureLoyalty(enabled: true, sarPerPoint: 50, pointsPerUnit: 1);
    }

    #[Test]
    public function string_money_amounts_match_numeric_equivalents(): void
    {
        $rules = app(LoyaltyRuleService::class);

        $this->assertSame(1, $rules->calculatePoints('50'));
        $this->assertSame(1, $rules->calculatePoints('50.00'));
        $this->assertSame(2, $rules->calculatePoints('100.00'));
        $this->assertSame(3, $rules->calculatePoints('150.00'));
    }

    #[Test]
    public function one_hundred_fifty_sar_yields_three_points(): void
    {
        $this->assertSame(3, app(LoyaltyRuleService::class)->calculatePoints(150));
    }

    #[Test]
    public function re_enabled_program_accrues_after_prior_disable(): void
    {
        $this->configureLoyalty(enabled: false);
        [, $orderWhileDisabled] = $this->payOrderForVendor();
        event(new PaymentSucceeded($orderWhileDisabled->payment->fresh()));

        $this->assertDatabaseMissing('loyalty_transactions', [
            'order_id' => $orderWhileDisabled->id,
            'type' => LoyaltyTransactionType::Earn->value,
        ]);

        $this->configureLoyalty(enabled: true);
        [, $orderWhileEnabled] = $this->payOrderForVendor();
        event(new PaymentSucceeded($orderWhileEnabled->payment->fresh()));

        $this->assertDatabaseHas('loyalty_transactions', [
            'order_id' => $orderWhileEnabled->id,
            'type' => LoyaltyTransactionType::Earn->value,
        ]);
    }

    #[Test]
    public function unpaid_order_does_not_accrue_points(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        [$customer, $order] = $this->createPayableOrderForVendor($vendor);

        $this->assertDatabaseMissing('loyalty_transactions', [
            'order_id' => $order->id,
        ]);
    }

    #[Test]
    public function failed_payment_simulation_does_not_accrue_points(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 200.00,
        ]);

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => (string) Str::uuid(),
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'failed',
        ])->assertOk();

        $this->assertDatabaseMissing('loyalty_transactions', [
            'order_id' => $orderId,
            'type' => LoyaltyTransactionType::Earn->value,
        ]);
    }

    #[Test]
    public function duplicate_reversal_is_idempotent(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(salePrice: 500.00);
        $order = $vendorOrder->order;
        event(new PaymentSucceeded($order->payment->fresh()));

        $returnRequest = $this->createRefundedReturn($customer, $vendor, $vendorOrder, $item);

        $reversal = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Reversal)
            ->firstOrFail();

        $ledger = app(LoyaltyLedgerService::class);
        $second = $ledger->reverseForRefund($returnRequest->fresh(['order.user', 'refund']));

        $this->assertSame($reversal->id, $second?->id);

        $reversalCount = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Reversal)
            ->count();

        $this->assertSame(1, $reversalCount);
    }

    #[Test]
    public function full_refund_reverses_all_earned_points(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(salePrice: 500.00);
        $order = $vendorOrder->order;
        event(new PaymentSucceeded($order->payment->fresh()));

        $earn = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Earn)
            ->firstOrFail();

        $returnRequest = $this->createRefundedReturn($customer, $vendor, $vendorOrder, $item);

        $reversal = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Reversal)
            ->firstOrFail();

        $rules = app(LoyaltyRuleService::class);
        $expectedReversal = $rules->calculateReversalPoints(
            $earn->points,
            $order->grand_total,
            (string) $returnRequest->refund?->total_amount,
        );

        $this->assertSame(-$expectedReversal, $reversal->points);
        $this->assertSame(
            max(0, $earn->points + $reversal->points),
            LoyaltyAccount::query()->where('user_id', $customer->id)->value('balance'),
        );
    }

    #[Test]
    public function return_updated_listener_reverses_loyalty_once(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(salePrice: 500.00);

        $order = $vendorOrder->order;
        event(new PaymentSucceeded($order->payment->fresh()));

        $returnId = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.return_request.id');

        $this->advanceReturnToRefunded($vendor, $returnId);

        $returnRequest = ReturnRequest::query()->findOrFail($returnId);
        event(new ReturnUpdated($returnRequest->fresh(['order.user', 'refund'])));
        event(new ReturnUpdated($returnRequest->fresh(['order.user', 'refund'])));

        $reversalCount = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Reversal)
            ->count();

        $this->assertSame(1, $reversalCount);
        $this->assertDatabaseHas('loyalty_transactions', [
            'order_id' => $order->id,
            'type' => LoyaltyTransactionType::Earn->value,
        ]);
    }

    #[Test]
    public function earn_transactions_remain_immutable_after_reversal(): void
    {
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(salePrice: 500.00);
        $order = $vendorOrder->order;
        event(new PaymentSucceeded($order->payment->fresh()));

        $earn = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Earn)
            ->firstOrFail();

        $originalPoints = $earn->points;
        $returnRequest = $this->createRefundedReturn($customer, $vendor, $vendorOrder, $item);

        $earn->refresh();
        $this->assertSame($originalPoints, $earn->points);
        $this->assertSame(LoyaltyTransactionType::Earn, $earn->type);
    }

    #[Test]
    public function balance_matches_ledger_after_earn_reversal_and_adjustment(): void
    {
        $admin = $this->createUserWithRole(RoleName::Admin);
        [$customer, $vendor, $vendorOrder, $item] = $this->deliverSingleItemOrder(salePrice: 500.00);
        $order = $vendorOrder->order;
        event(new PaymentSucceeded($order->payment->fresh()));

        $returnRequest = $this->createRefundedReturn($customer, $vendor, $vendorOrder, $item);

        $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
            'points' => 25,
            'direction' => 'credit',
            'reason' => 'Goodwill credit after partial refund',
        ])->assertOk();

        $account = LoyaltyAccount::query()->where('user_id', $customer->id)->firstOrFail();
        $ledgerSum = (int) LoyaltyTransaction::query()
            ->where('loyalty_account_id', $account->id)
            ->sum('points');

        $this->assertSame($ledgerSum, $account->balance);
    }

    #[Test]
    public function admin_without_loyalty_adjust_permission_is_forbidden(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $admin = $this->createUserWithRole(RoleName::Admin);
        $adminRole = Role::query()->where('name', RoleName::Admin)->firstOrFail();

        $keys = Permission::query()
            ->where('key', '!=', AdminPermission::LoyaltyAdjust->value)
            ->pluck('key')
            ->all();

        app(AdminRolePermissionService::class)->syncPermissions($adminRole, $keys, $admin);
        app(AdminPermissionService::class)->forget($admin);

        $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
            'points' => 10,
            'direction' => 'credit',
            'reason' => 'Should be rejected',
        ])->assertForbidden();
    }

    #[Test]
    public function customer_cannot_create_admin_adjustment(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        Sanctum::actingAs($customer);

        $this->postJson("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", [
            'points' => 999,
            'direction' => 'credit',
            'reason' => 'Self credit attempt',
        ])->assertUnauthorized();
    }

    #[Test]
    public function invalid_transaction_type_filter_returns_validation_error(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser('/api/v1/loyalty/transactions?type=invalid', $customer)
            ->assertUnprocessable();
    }

    #[Test]
    public function transaction_pagination_and_filtering_work(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $admin = $this->createUserWithRole(RoleName::Admin);

        for ($i = 1; $i <= 3; $i++) {
            $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
                'points' => $i,
                'direction' => 'credit',
                'reason' => "Batch adjustment {$i}",
            ])->assertOk();
        }

        $pageOne = $this->getJsonAsUser('/api/v1/loyalty/transactions?per_page=2&page=1', $customer)
            ->assertOk();

        $this->assertSame(2, count($pageOne->json('data.items')));
        $this->assertSame(3, $pageOne->json('data.pagination.total'));
        $this->assertSame(2, $pageOne->json('data.pagination.last_page'));

        $filtered = $this->getJsonAsUser('/api/v1/loyalty/transactions?type=adjust', $customer)
            ->assertOk();

        $this->assertSame(3, $filtered->json('data.pagination.total'));
        $this->assertTrue(collect($filtered->json('data.items'))->every(
            fn (array $item): bool => $item['type'] === 'adjust',
        ));
    }

    #[Test]
    public function excessive_admin_adjustment_is_rejected(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $admin = $this->createUserWithRole(RoleName::Admin);

        config(['diyar.loyalty.max_adjustment_points' => 100]);

        $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
            'points' => 101,
            'direction' => 'credit',
            'reason' => 'Too many points',
        ])->assertUnprocessable();
    }

    #[Test]
    public function invalid_loyalty_configuration_is_clamped_to_safe_minimums(): void
    {
        config([
            'diyar.commerce.loyalty_sar_per_point' => 0,
            'diyar.commerce.loyalty_points_per_unit' => 0,
        ]);

        $rules = app(LoyaltyRuleService::class);

        $this->assertSame(1, $rules->sarPerPoint());
        $this->assertSame(1, $rules->pointsPerUnit());
        $this->assertSame(100, $rules->calculatePoints(100));
    }

    /**
     * @return array{0: User, 1: Order}
     */
    private function payOrderForVendor(): array
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        [$customer, $order] = $this->createPayableOrderForVendor($vendor);

        app(PaymentFinalizationService::class)->finalizePaid(
            payment: $order->payment,
            gatewayPaymentId: 'gw-loyalty-'.$order->id,
            gatewayInvoiceId: 'inv-loyalty-'.$order->id,
        );

        return [$customer, $order->fresh(['payment'])];
    }

    private function createRefundedReturn(
        User $customer,
        User $vendor,
        VendorOrder $vendorOrder,
        OrderItem $item,
    ): ReturnRequest {
        $returnId = $this->postJsonAsUser('/api/v1/returns', $customer, [
            'vendor_order_id' => $vendorOrder->id,
            'reason' => ReturnReason::ManufacturingDefect->value,
            'items' => [['order_item_id' => $item->id, 'quantity' => 1]],
        ])->assertCreated()->json('data.return_request.id');

        $this->advanceReturnToRefunded($vendor, $returnId);

        return ReturnRequest::query()->with(['order.user', 'refund'])->findOrFail($returnId);
    }

    /**
     * @param  array<string, mixed>  $policy
     * @return array{0: User, 1: User, 2: VendorOrder, 3: OrderItem}
     */
    private function deliverSingleItemOrder(
        int $quantity = 1,
        float $salePrice = 150.00,
        array $policy = [],
    ): array {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $vendor = $this->createUserWithRole(RoleName::Vendor);

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => $salePrice,
            'return_requires_evidence' => false,
        ]);

        VendorReturnPolicy::query()->create(array_merge([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 14,
            'accepted_reasons' => [ReturnReason::ManufacturingDefect->value],
            'requires_unused' => false,
            'requires_evidence' => false,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ], $policy));

        $this->createVendorShippingSettings($vendor->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product, $quantity);

        $orderId = $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
        ])->assertCreated()->json('data.order.id');

        $paymentInit = $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment", $customer, [
            'idempotency_key' => (string) Str::uuid(),
        ])->assertOk();

        $this->postJsonAsUser("/api/v1/orders/{$orderId}/payment/simulate", $customer, [
            'attempt_id' => $paymentInit->json('data.attempt_id'),
            'outcome' => 'success',
        ])->assertOk();

        $order = Order::query()->with(['vendorOrders.items', 'vendorOrders.shipment', 'payment'])->findOrFail($orderId);
        $vendorOrder = $order->vendorOrders->first();
        $item = $vendorOrder->items->first();

        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/accept", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/process", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/ship", $vendor, [
            'tracking_number' => 'LOY-'.$vendorOrder->id,
        ])->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/orders/{$vendorOrder->id}/deliver", $vendor)->assertOk();

        $vendorOrder->refresh()->load(['items', 'shipment', 'order.payment']);
        $item->refresh();

        return [$customer, $vendor, $vendorOrder, $item];
    }

    private function advanceReturnToRefunded(User $vendor, string $returnId): void
    {
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/submit-review", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/approve", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/received", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/inspect", $vendor)->assertOk();
        $this->postJsonAsUser("/api/v1/dashboard/vendor/returns/{$returnId}/refund", $vendor, [
            'idempotency_key' => 'refund-'.$returnId,
        ])->assertOk();
    }

    private function configureLoyalty(bool $enabled, int $sarPerPoint = 50, int $pointsPerUnit = 1): void
    {
        config([
            'diyar.commerce.loyalty_enabled' => $enabled,
            'diyar.commerce.loyalty_sar_per_point' => $sarPerPoint,
            'diyar.commerce.loyalty_points_per_unit' => $pointsPerUnit,
        ]);
    }
}
