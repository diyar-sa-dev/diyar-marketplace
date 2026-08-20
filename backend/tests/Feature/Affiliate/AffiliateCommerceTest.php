<?php

namespace Tests\Feature\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Enums\AffiliatePayoutStatus;
use App\Enums\AffiliateProfileStatus;
use App\Enums\BalanceBucket;
use App\Enums\FinancialTransactionType;
use App\Enums\RoleName;
use App\Events\Domain\OrderDelivered;
use App\Events\Domain\PaymentSucceeded;
use App\Models\AffiliateClick;
use App\Models\AffiliateCommission;
use App\Models\AffiliateLink;
use App\Models\AffiliateProfile;
use App\Models\FinancialTransaction;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductAffiliateSetting;
use App\Models\User;
use App\Services\Affiliate\AffiliateAttributionService;
use App\Services\Affiliate\AffiliateCommissionService;
use App\Services\Affiliate\AffiliateProfileService;
use App\Services\Payments\PaymentFinalizationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class AffiliateCommerceTest extends TestCase
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
    public function vendor_can_enable_product_affiliate_settings(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $this->patchJsonAsUser("/api/v1/dashboard/vendor/products/{$product->id}/affiliate", $vendor, [
            'enabled' => true,
            'commission_min_percent' => 5,
            'commission_max_percent' => 15,
            'commission_rate_percent' => 10,
        ])
            ->assertOk()
            ->assertJsonPath('data.affiliate.enabled', true)
            ->assertJsonPath('data.affiliate.commission_rate_percent', '10.00');

        $this->assertDatabaseHas('product_affiliate_settings', [
            'product_id' => $product->id,
            'enabled' => true,
        ]);
    }

    #[Test]
    public function vendor_cannot_create_affiliate_link_for_own_product(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $marketerRole = \App\Models\Role::query()->where('name', RoleName::Marketer->value)->firstOrFail();
        $vendor->roles()->attach($marketerRole->id, [
            'id' => (string) str()->uuid(),
            'status' => \App\Enums\RoleStatus::Active->value,
        ]);
        $vendor = $vendor->fresh('roles');

        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 200.00,
        ]);

        ProductAffiliateSetting::query()->create([
            'product_id' => $product->id,
            'enabled' => true,
            'commission_min_percent' => 5,
            'commission_max_percent' => 15,
            'commission_rate_percent' => 10,
        ]);

        $this->postJsonAsUser('/api/v1/dashboard/affiliate/links', $vendor, [
            'name' => 'Own product link',
            'product_id' => $product->id,
            'commission_rate_percent' => 10,
        ])->assertStatus(422)
            ->assertJsonPath('message', __('diyar.affiliate.cannot_promote_own_product'));
    }

    #[Test]
    public function marketer_can_create_affiliate_link_and_track_click(): void
    {
        [$product, $link] = $this->seedAffiliateProductAndLink();
        $session = 'sess-'.Str::uuid();

        $this->postJson('/api/v1/affiliate/referrals/click', [
            'ref' => $link->referral_code,
            'product_id' => $product->id,
            'session_fingerprint' => $session,
        ])->assertOk()
            ->assertJsonPath('data.attributed', true);

        $this->assertDatabaseHas('affiliate_clicks', [
            'affiliate_link_id' => $link->id,
            'session_fingerprint' => $session,
        ]);

        $this->assertDatabaseHas('affiliate_attributions', [
            'affiliate_link_id' => $link->id,
            'product_id' => $product->id,
            'session_fingerprint' => $session,
        ]);
    }

    #[Test]
    public function duplicate_click_within_dedupe_window_does_not_inflate_metrics(): void
    {
        [$product, $link] = $this->seedAffiliateProductAndLink();
        $session = 'sess-dedupe-'.Str::uuid();

        config(['diyar.affiliate.click_dedupe_window_minutes' => 60]);

        $payload = [
            'ref' => $link->referral_code,
            'product_id' => $product->id,
            'session_fingerprint' => $session,
        ];

        $this->postJson('/api/v1/affiliate/referrals/click', $payload)->assertOk();
        $this->postJson('/api/v1/affiliate/referrals/click', $payload)->assertOk();

        $this->assertSame(1, AffiliateClick::query()
            ->where('affiliate_link_id', $link->id)
            ->where('session_fingerprint', $session)
            ->count());

        $this->assertSame(1, $link->fresh()->click_count);
    }

    #[Test]
    public function resolve_endpoint_is_rate_limited(): void
    {
        [$product, $link] = $this->seedAffiliateProductAndLink();
        $session = 'sess-resolve-'.Str::uuid();

        config(['diyar.affiliate.resolve_rate_limit_per_minute' => 2]);

        $query = http_build_query([
            'ref' => $link->referral_code,
            'product_id' => $product->id,
            'session_fingerprint' => $session,
        ]);

        $this->getJson("/api/v1/affiliate/referrals/resolve?{$query}")->assertOk();
        $this->getJson("/api/v1/affiliate/referrals/resolve?{$query}")->assertOk();
        $this->getJson("/api/v1/affiliate/referrals/resolve?{$query}")->assertStatus(429);
    }

    #[Test]
    public function affiliate_commission_posts_financial_ledger_entries(): void
    {
        [$product, $link, , $order] = $this->createAffiliateOrderWithAttribution();
        $orderItem = $order->vendorOrders->first()->items->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            payment: $order->payment,
            gatewayPaymentId: 'gw-ledger-1',
            gatewayInvoiceId: 'inv-ledger-1',
        );

        event(new PaymentSucceeded($order->payment->fresh()));

        $commission = AffiliateCommission::query()
            ->where('order_item_id', $orderItem->id)
            ->firstOrFail();

        $this->assertDatabaseHas('financial_transactions', [
            'source_type' => 'affiliate_commission',
            'source_id' => $commission->id,
            'transaction_type' => FinancialTransactionType::AffiliateCommission->value,
            'balance_bucket' => BalanceBucket::AffiliatePayable->value,
            'direction' => 'credit',
        ]);

        event(new OrderDelivered($order->vendorOrders->first()->fresh(['items', 'order', 'shipment', 'vendorAccount'])));

        $this->assertSame(1, FinancialTransaction::query()
            ->where('source_type', 'affiliate_commission_release')
            ->where('source_id', $commission->id)
            ->where('balance_bucket', BalanceBucket::AffiliateAvailable->value)
            ->where('direction', 'credit')
            ->count());

        app(AffiliateCommissionService::class)->markAvailableForVendorOrder($order->vendorOrders->first()->fresh());

        $this->assertSame(1, FinancialTransaction::query()
            ->where('source_type', 'affiliate_commission_release')
            ->where('source_id', $commission->id)
            ->where('balance_bucket', BalanceBucket::AffiliateAvailable->value)
            ->count());
    }

    #[Test]
    public function self_referral_is_blocked_on_click_and_order_snapshot(): void
    {
        [$product, $link, $marketer] = $this->seedAffiliateProductAndLink(withMarketer: true);
        $session = 'sess-self-'.Str::uuid();

        $this->actingAs($marketer)->postJson('/api/v1/affiliate/referrals/click', [
            'ref' => $link->referral_code,
            'product_id' => $product->id,
            'session_fingerprint' => $session,
        ])->assertOk()
            ->assertJsonPath('data.attributed', false);

        $attribution = app(AffiliateAttributionService::class)->resolveAttributionForProduct(
            user: $marketer,
            sessionFingerprint: $session,
            productId: $product->id,
        );

        $this->assertNull($attribution);
    }

    #[Test]
    public function order_creation_snapshots_affiliate_attribution_on_items(): void
    {
        [$product, $link, $marketer] = $this->seedAffiliateProductAndLink(withMarketer: true);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $session = 'sess-order-'.Str::uuid();

        app(AffiliateAttributionService::class)->recordClick(
            referralCode: $link->referral_code,
            productId: $product->id,
            sessionFingerprint: $session,
            ip: '127.0.0.1',
            user: $customer,
        );

        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
            'X-Affiliate-Session' => $session,
        ])->assertCreated();

        $orderItem = OrderItem::query()->where('product_id', $product->id)->firstOrFail();

        $this->assertSame($link->affiliate_profile_id, $orderItem->affiliate_profile_id);
        $this->assertSame($link->id, $orderItem->affiliate_link_id);
        $this->assertNotNull($orderItem->affiliate_commission_amount);
    }

    #[Test]
    public function payment_success_creates_pending_commission_and_delivery_makes_it_available(): void
    {
        [$product, $link, , $order] = $this->createAffiliateOrderWithAttribution();
        $orderItem = $order->vendorOrders->first()->items->first();

        app(PaymentFinalizationService::class)->finalizePaid(
            payment: $order->payment,
            gatewayPaymentId: 'gw-1',
            gatewayInvoiceId: 'inv-1',
        );

        event(new PaymentSucceeded($order->payment->fresh()));

        $commission = AffiliateCommission::query()
            ->where('order_item_id', $orderItem->id)
            ->firstOrFail();

        $this->assertSame(AffiliateCommissionStatus::Pending, $commission->status);

        $vendorOrder = $order->vendorOrders->first();
        event(new OrderDelivered($vendorOrder->fresh(['items', 'order', 'shipment', 'vendorAccount'])));

        $commission->refresh();
        $this->assertSame(AffiliateCommissionStatus::Available, $commission->status);
        $this->assertNotNull($commission->available_at);
    }

    #[Test]
    public function marketer_can_request_payout_when_balance_is_available(): void
    {
        [$product, $link, $marketer, $order] = $this->createAffiliateOrderWithAttribution();
        $profile = AffiliateProfile::query()->findOrFail($link->affiliate_profile_id);
        $profile->update([
            'payout_iban' => 'SA0380000000608010167519',
            'payout_account_holder' => 'Marketer One',
        ]);

        app(PaymentFinalizationService::class)->finalizePaid(
            payment: $order->payment,
            gatewayPaymentId: 'gw-2',
            gatewayInvoiceId: 'inv-2',
        );
        event(new OrderDelivered($order->vendorOrders->first()->fresh(['items', 'order', 'shipment', 'vendorAccount'])));

        config(['diyar.affiliate.payout_minimum' => '1.00']);

        $this->postJsonAsUser('/api/v1/dashboard/affiliate/payouts', $marketer, [
            'amount' => '1.00',
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertCreated()
            ->assertJsonPath('data.payout.status', AffiliatePayoutStatus::Pending->value);

        $this->assertDatabaseHas('affiliate_payouts', [
            'affiliate_profile_id' => $profile->id,
            'status' => AffiliatePayoutStatus::Pending->value,
        ]);
    }

    #[Test]
    public function admin_can_process_affiliate_payout_lifecycle(): void
    {
        [$product, $link, $marketer, $order] = $this->createAffiliateOrderWithAttribution();
        $profile = AffiliateProfile::query()->findOrFail($link->affiliate_profile_id);
        $profile->update([
            'payout_iban' => 'SA0380000000608010167519',
            'payout_account_holder' => 'Marketer One',
        ]);
        $admin = $this->createUserWithRole(RoleName::Admin);

        app(PaymentFinalizationService::class)->finalizePaid(
            payment: $order->payment,
            gatewayPaymentId: 'gw-admin-1',
            gatewayInvoiceId: 'inv-admin-1',
        );
        event(new OrderDelivered($order->vendorOrders->first()->fresh(['items', 'order', 'shipment', 'vendorAccount'])));

        config(['diyar.affiliate.payout_minimum' => '1.00']);

        $payoutId = $this->postJsonAsUser('/api/v1/dashboard/affiliate/payouts', $marketer, [
            'amount' => '1.00',
        ], ['Idempotency-Key' => (string) Str::uuid()])
            ->assertCreated()
            ->json('data.payout.id');

        $this->postJsonAsUser("/api/v1/admin/affiliate/payouts/{$payoutId}/approve", $admin)->assertOk();
        $this->postJsonAsUser("/api/v1/admin/affiliate/payouts/{$payoutId}/processing", $admin)->assertOk();
        $this->postJsonAsUser("/api/v1/admin/affiliate/payouts/{$payoutId}/mark-paid", $admin, [
            'payment_reference' => 'BNK-123',
        ])->assertOk()
            ->assertJsonPath('data.payout.status', AffiliatePayoutStatus::Paid->value);

        $this->assertDatabaseHas('financial_transactions', [
            'source_type' => 'affiliate_payout',
            'source_id' => $payoutId,
            'balance_bucket' => BalanceBucket::AffiliateAvailable->value,
            'direction' => 'debit',
        ]);

        $this->assertDatabaseHas('affiliate_commissions', [
            'affiliate_payout_id' => $payoutId,
            'status' => AffiliateCommissionStatus::Paid->value,
        ]);
    }

    #[Test]
    public function disabled_affiliate_program_blocks_new_clicks_but_preserves_attribution(): void
    {
        [$product, $link] = $this->seedAffiliateProductAndLink();
        $vendor = User::query()
            ->whereHas('vendorAccount', fn ($query) => $query->whereKey($product->vendor_account_id))
            ->firstOrFail();
        $session = 'sess-disabled-'.Str::uuid();

        app(AffiliateAttributionService::class)->recordClick(
            referralCode: $link->referral_code,
            productId: $product->id,
            sessionFingerprint: $session,
        );

        $this->patchJsonAsUser("/api/v1/dashboard/vendor/products/{$product->id}/affiliate", $vendor, [
            'enabled' => false,
            'commission_min_percent' => 5,
            'commission_max_percent' => 15,
            'commission_rate_percent' => 10,
        ])->assertOk();

        $this->postJson('/api/v1/affiliate/referrals/click', [
            'ref' => $link->referral_code,
            'product_id' => $product->id,
            'session_fingerprint' => $session,
        ])->assertStatus(422);

        $attribution = app(AffiliateAttributionService::class)->resolveAttributionForProduct(
            user: null,
            sessionFingerprint: $session,
            productId: $product->id,
        );

        $this->assertNotNull($attribution);
        $this->assertSame($link->id, $attribution['affiliate_link_id']);
    }

    #[Test]
    public function multi_vendor_order_applies_commission_per_eligible_line_only(): void
    {
        $vendorA = $this->createUserWithRole(RoleName::Vendor);
        $vendorB = $this->createUserWithRole(RoleName::Vendor);
        $vendorC = $this->createUserWithRole(RoleName::Vendor);

        $productA = Product::factory()->create([
            'vendor_account_id' => $vendorA->vendorAccount->id,
            'sale_price' => 200.00,
        ]);
        $productB = Product::factory()->create([
            'vendor_account_id' => $vendorB->vendorAccount->id,
            'sale_price' => 300.00,
        ]);
        $productC = Product::factory()->create([
            'vendor_account_id' => $vendorC->vendorAccount->id,
            'sale_price' => 100.00,
        ]);

        ProductAffiliateSetting::query()->create([
            'product_id' => $productA->id,
            'enabled' => true,
            'commission_min_percent' => 5,
            'commission_max_percent' => 15,
            'commission_rate_percent' => 10,
        ]);
        ProductAffiliateSetting::query()->create([
            'product_id' => $productB->id,
            'enabled' => true,
            'commission_min_percent' => 5,
            'commission_max_percent' => 20,
            'commission_rate_percent' => 15,
        ]);

        $marketer = $this->createUserWithRole(RoleName::Marketer);
        $profile = app(AffiliateProfileService::class)->resolveOrCreateForUser($marketer);
        $profile->update(['status' => AffiliateProfileStatus::Active]);

        $linkA = AffiliateLink::query()->create([
            'affiliate_profile_id' => $profile->id,
            'product_id' => $productA->id,
            'name' => 'Vendor A Campaign',
            'referral_code' => 'REFA'.Str::upper(Str::random(4)),
            'commission_rate_percent' => 10,
            'is_active' => true,
        ]);
        $linkB = AffiliateLink::query()->create([
            'affiliate_profile_id' => $profile->id,
            'product_id' => $productB->id,
            'name' => 'Vendor B Campaign',
            'referral_code' => 'REFB'.Str::upper(Str::random(4)),
            'commission_rate_percent' => 15,
            'is_active' => true,
        ]);

        $customer = $this->createUserWithRole(RoleName::Customer);
        $session = 'sess-multi-'.Str::uuid();
        $attribution = app(AffiliateAttributionService::class);

        $attribution->recordClick($linkA->referral_code, $productA->id, $session, '127.0.0.1', $customer);
        $attribution->recordClick($linkB->referral_code, $productB->id, $session, '127.0.0.1', $customer);

        $this->createVendorShippingSettings($vendorA->vendorAccount);
        $this->createVendorShippingSettings($vendorB->vendorAccount);
        $this->createVendorShippingSettings($vendorC->vendorAccount);
        $address = $this->createCustomerAddress($customer);

        $this->addProductToUserCart($customer, $productA);
        $this->addProductToUserCart($customer, $productB);
        $this->addProductToUserCart($customer, $productC);

        $this->postJsonAsUser('/api/v1/orders', $customer, [
            'shipping_address_id' => $address->id,
            'vendor_delivery_selections' => [
                ['vendor_account_id' => $vendorA->vendorAccount->id, 'method' => 'carrier'],
                ['vendor_account_id' => $vendorB->vendorAccount->id, 'method' => 'carrier'],
                ['vendor_account_id' => $vendorC->vendorAccount->id, 'method' => 'carrier'],
            ],
        ], [
            'Idempotency-Key' => (string) Str::uuid(),
            'X-Affiliate-Session' => $session,
        ])->assertCreated();

        $itemA = OrderItem::query()->where('product_id', $productA->id)->firstOrFail();
        $itemB = OrderItem::query()->where('product_id', $productB->id)->firstOrFail();
        $itemC = OrderItem::query()->where('product_id', $productC->id)->firstOrFail();

        $this->assertSame('10.00', number_format((float) $itemA->affiliate_commission_rate, 2, '.', ''));
        $this->assertSame('20.00', number_format((float) $itemA->affiliate_commission_amount, 2, '.', ''));
        $this->assertSame('15.00', number_format((float) $itemB->affiliate_commission_rate, 2, '.', ''));
        $this->assertSame('45.00', number_format((float) $itemB->affiliate_commission_amount, 2, '.', ''));
        $this->assertNull($itemC->affiliate_profile_id);
        $this->assertNull($itemC->affiliate_commission_amount);
    }

    /**
     * @return array{0: Product, 1: AffiliateLink, 2?: User}
     */
    private function seedAffiliateProductAndLink(bool $withMarketer = false): array
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'sale_price' => 200.00,
        ]);

        ProductAffiliateSetting::query()->create([
            'product_id' => $product->id,
            'enabled' => true,
            'commission_min_percent' => 5,
            'commission_max_percent' => 15,
            'commission_rate_percent' => 10,
        ]);

        $marketer = $this->createUserWithRole(RoleName::Marketer);
        $profile = app(AffiliateProfileService::class)->resolveOrCreateForUser($marketer);
        $profile->update(['status' => AffiliateProfileStatus::Active]);

        $link = AffiliateLink::query()->create([
            'affiliate_profile_id' => $profile->id,
            'product_id' => $product->id,
            'name' => 'Summer Campaign',
            'referral_code' => strtoupper(Str::random(8)),
            'commission_rate_percent' => 10,
            'is_active' => true,
        ]);

        if ($withMarketer) {
            return [$product, $link, $marketer];
        }

        return [$product, $link];
    }

    /**
     * @return array{0: Product, 1: AffiliateLink, 2: User, 3: Order}
     */
    private function createAffiliateOrderWithAttribution(): array
    {
        [$product, $link, $marketer] = $this->seedAffiliateProductAndLink(withMarketer: true);
        $customer = $this->createUserWithRole(RoleName::Customer);
        $session = 'sess-pay-'.Str::uuid();

        app(AffiliateAttributionService::class)->recordClick(
            referralCode: $link->referral_code,
            productId: $product->id,
            sessionFingerprint: $session,
            ip: '127.0.0.1',
            user: $customer,
        );

        $this->createVendorShippingSettings($product->vendorAccount);
        $address = $this->createCustomerAddress($customer);
        $this->addProductToUserCart($customer, $product);

        $this->postJsonAsUser('/api/v1/orders', $customer, $this->checkoutPayload($address, $product), [
            'Idempotency-Key' => (string) Str::uuid(),
            'X-Affiliate-Session' => $session,
        ])->assertCreated();

        $order = Order::query()->latest()->firstOrFail();
        $order->load('payment', 'vendorOrders.items');

        return [$product, $link, $marketer, $order];
    }
}
