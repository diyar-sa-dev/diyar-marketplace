<?php

namespace Tests\Unit\Returns;

use App\Enums\ReturnReason;
use App\Enums\RoleName;
use App\Models\Product;
use App\Models\VendorReturnPolicy;
use App\Services\Returns\EffectiveReturnPolicyService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class EffectiveReturnPolicyServiceTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    private EffectiveReturnPolicyService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = app(EffectiveReturnPolicyService::class);
    }

    public function test_platform_baseline_is_used_when_no_overrides(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        $policy = $this->service->resolveForProduct($vendor->vendorAccount, $product);

        $this->assertTrue($policy->returnable);
        $this->assertSame(14, $policy->returnWindowDays);
        $this->assertSame('platform', $policy->source);
        $this->assertContains(ReturnReason::ManufacturingDefect->value, $policy->acceptedReasons);
    }

    public function test_vendor_policy_overrides_platform(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create(['vendor_account_id' => $vendor->vendorAccount->id]);

        VendorReturnPolicy::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 10,
            'accepted_reasons' => [ReturnReason::Damaged->value],
            'requires_unused' => false,
            'requires_evidence' => false,
            'return_shipping_paid_by' => 'vendor',
            'shipping_refundable' => true,
        ]);

        $policy = $this->service->resolveForProduct($vendor->vendorAccount, $product);

        $this->assertSame(10, $policy->returnWindowDays);
        $this->assertSame('vendor', $policy->source);
        $this->assertSame([ReturnReason::Damaged->value], $policy->acceptedReasons);
        $this->assertTrue($policy->shippingRefundable);
    }

    public function test_product_override_wins_over_vendor(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'return_policy_override_enabled' => true,
            'return_window_days' => 7,
            'return_accepted_reasons' => [ReturnReason::ManufacturingDefect->value],
            'return_requires_evidence' => false,
        ]);

        VendorReturnPolicy::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 30,
            'accepted_reasons' => [ReturnReason::WrongItem->value],
            'requires_unused' => true,
            'requires_evidence' => true,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ]);

        $policy = $this->service->resolveForProduct($vendor->vendorAccount, $product->fresh());

        $this->assertSame(7, $policy->returnWindowDays);
        $this->assertSame('product', $policy->source);
        $this->assertSame([ReturnReason::ManufacturingDefect->value], $policy->acceptedReasons);
        $this->assertFalse($policy->requiresEvidence);
    }

    public function test_product_returnable_false_overrides_only_returnable_field(): void
    {
        $vendor = $this->createUserWithRole(RoleName::Vendor);
        $product = Product::factory()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'return_policy_override_enabled' => true,
            'returnable' => false,
        ]);

        VendorReturnPolicy::query()->create([
            'vendor_account_id' => $vendor->vendorAccount->id,
            'returnable' => true,
            'return_window_days' => 7,
            'accepted_reasons' => [ReturnReason::ManufacturingDefect->value],
            'requires_unused' => false,
            'requires_evidence' => false,
            'return_shipping_paid_by' => 'customer',
            'shipping_refundable' => false,
        ]);

        $policy = $this->service->resolveForProduct($vendor->vendorAccount, $product->fresh());

        $this->assertFalse($policy->returnable);
        $this->assertSame(7, $policy->returnWindowDays);
        $this->assertSame([ReturnReason::ManufacturingDefect->value], $policy->acceptedReasons);
        $this->assertSame('product', $policy->source);
    }
}
