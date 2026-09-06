<?php

namespace Tests\Feature\Loyalty;

use App\Enums\LoyaltyTransactionType;
use App\Enums\RoleName;
use App\Events\Domain\PaymentSucceeded;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\User;
use App\Services\Loyalty\LoyaltyRuleService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class LoyaltyCommerceTest extends TestCase
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
        $this->configureLoyalty(enabled: true, sarPerPoint: 50, pointsPerUnit: 1);
    }

    #[Test]
    public function rule_service_calculates_points_with_floor_rounding(): void
    {
        $rules = app(LoyaltyRuleService::class);

        $this->assertSame(0, $rules->calculatePoints(49));
        $this->assertSame(1, $rules->calculatePoints(50));
        $this->assertSame(1, $rules->calculatePoints(99));
        $this->assertSame(2, $rules->calculatePoints(100));
        $this->assertSame(2, $rules->calculatePoints(149));
    }

    #[Test]
    public function updated_configuration_affects_future_accrual(): void
    {
        $rules = app(LoyaltyRuleService::class);
        $this->assertSame(2, $rules->calculatePoints(100));

        $this->configureLoyalty(enabled: true, sarPerPoint: 100, pointsPerUnit: 1);

        $rules = app(LoyaltyRuleService::class);
        $this->assertSame(1, $rules->calculatePoints(100));
    }

    #[Test]
    public function disabled_program_awards_no_points(): void
    {
        $this->configureLoyalty(enabled: false);

        [$customer, $order] = $this->payOrderForVendor();

        event(new PaymentSucceeded($order->payment->fresh()));

        $this->assertDatabaseMissing('loyalty_transactions', [
            'order_id' => $order->id,
            'type' => LoyaltyTransactionType::Earn->value,
        ]);
    }

    #[Test]
    public function successful_payment_awards_points_once(): void
    {
        [$customer, $order] = $this->payOrderForVendor();

        event(new PaymentSucceeded($order->payment->fresh()));
        event(new PaymentSucceeded($order->payment->fresh()));

        $earnCount = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Earn)
            ->count();

        $this->assertSame(1, $earnCount);

        $account = LoyaltyAccount::query()->where('user_id', $customer->id)->firstOrFail();
        $expected = app(LoyaltyRuleService::class)->calculatePoints((float) $order->grand_total);
        $this->assertSame($expected, $account->balance);
        $this->assertGreaterThan(0, $account->balance);
    }

    #[Test]
    public function customer_can_view_loyalty_summary_and_transactions(): void
    {
        [$customer, $order] = $this->payOrderForVendor();
        event(new PaymentSucceeded($order->payment->fresh()));

        $this->getJsonAsUser('/api/v1/loyalty', $customer)
            ->assertOk()
            ->assertJsonPath('data.loyalty.balance', fn ($value) => $value > 0)
            ->assertJsonPath('data.loyalty.enabled', true);

        $this->getJsonAsUser('/api/v1/loyalty/transactions?type=earn', $customer)
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1)
            ->assertJsonPath('data.items.0.type', 'earn');
    }

    #[Test]
    public function customer_cannot_view_another_customers_loyalty_data(): void
    {
        [$customer, $order] = $this->payOrderForVendor();
        event(new PaymentSucceeded($order->payment->fresh()));

        $other = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser('/api/v1/loyalty', $other)
            ->assertOk()
            ->assertJsonPath('data.loyalty.balance', 0);

        $this->getJsonAsUser('/api/v1/loyalty/transactions', $other)
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 0);
    }

    #[Test]
    public function admin_can_adjust_customer_points(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
            'points' => 100,
            'direction' => 'credit',
            'reason' => 'Customer service compensation',
        ])->assertOk()
            ->assertJsonPath('data.loyalty.balance', 100)
            ->assertJsonPath('data.transaction.type', 'adjust');

        $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
            'points' => 40,
            'direction' => 'debit',
            'reason' => 'Correction after review',
        ])->assertOk()
            ->assertJsonPath('data.loyalty.balance', 60);
    }

    #[Test]
    public function admin_adjustment_cannot_make_balance_negative(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $admin = $this->createUserWithRole(RoleName::Admin);

        $this->postJsonAsAdmin("/api/v1/admin/loyalty/customers/{$customer->id}/adjust", $admin, [
            'points' => 10,
            'direction' => 'debit',
            'reason' => 'Invalid debit attempt',
        ])->assertStatus(422);
    }

    #[Test]
    public function reversal_service_reverses_proportional_points(): void
    {
        $rules = app(LoyaltyRuleService::class);

        $this->assertSame(10, $rules->calculateReversalPoints(20, 1000, 500));
        $this->assertSame(20, $rules->calculateReversalPoints(20, 1000, 1000));
    }

    #[Test]
    public function rewards_endpoint_returns_empty_catalog(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);

        $this->getJsonAsUser('/api/v1/loyalty/rewards', $customer)
            ->assertOk()
            ->assertJsonPath('data.available', false)
            ->assertJsonPath('data.items', []);
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

    private function configureLoyalty(bool $enabled, int $sarPerPoint = 50, int $pointsPerUnit = 1): void
    {
        config([
            'diyar.commerce.loyalty_enabled' => $enabled,
            'diyar.commerce.loyalty_sar_per_point' => $sarPerPoint,
            'diyar.commerce.loyalty_points_per_unit' => $pointsPerUnit,
        ]);
    }
}
