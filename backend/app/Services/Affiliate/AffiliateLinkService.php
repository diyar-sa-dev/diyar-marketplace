<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateCommissionStatus;
use App\Models\AffiliateLink;
use App\Models\AffiliateProfile;
use App\Models\Product;
use App\Support\Vendor\VendorOwnership;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use InvalidArgumentException;

final class AffiliateLinkService
{
    public function __construct(
        private readonly AffiliateCommissionRules $rules,
        private readonly ProductAffiliateSettingsService $productSettings,
        private readonly AffiliateProfileService $profiles,
        private readonly VendorOwnership $vendorOwnership,
    ) {}

    /**
     * @param  array{name: string, product_id: string, commission_rate_percent?: float, campaign_name?: string, source?: string}  $payload
     */
    public function create(AffiliateProfile $profile, array $payload): AffiliateLink
    {
        if ($profile->status->value !== 'active') {
            throw new InvalidArgumentException(__('diyar.affiliate.profile_not_active'));
        }

        $product = Product::query()->findOrFail($payload['product_id']);
        $profile->loadMissing('user');

        if ($profile->user !== null && $this->vendorOwnership->userOwnsProduct($profile->user, $product)) {
            throw new InvalidArgumentException(__('diyar.affiliate.cannot_promote_own_product'));
        }

        $setting = $this->productSettings->assertAffiliateEnabled($product);

        $rate = isset($payload['commission_rate_percent'])
            ? (float) $payload['commission_rate_percent']
            : (float) $setting->commission_rate_percent;

        $this->rules->assertRateWithinRange(
            $rate,
            (float) $setting->commission_min_percent,
            (float) $setting->commission_max_percent,
        );

        return AffiliateLink::query()->create([
            'affiliate_profile_id' => $profile->id,
            'product_id' => $product->id,
            'name' => $payload['name'],
            'referral_code' => $this->profiles->generateReferralCode(),
            'commission_rate_percent' => number_format($rate, 2, '.', ''),
            'is_active' => true,
            'campaign_name' => $payload['campaign_name'] ?? null,
            'source' => $payload['source'] ?? null,
        ]);
    }

    public function listForProfile(AffiliateProfile $profile, int $perPage = 20): LengthAwarePaginator
    {
        return AffiliateLink::query()
            ->with([
                'product:id,name,slug,sale_price,vendor_account_id',
                'product.affiliateSetting:product_id,enabled',
            ])
            ->withCount([
                'commissions as gross_conversions',
                'commissions as reversed_conversions' => fn ($query) => $query->where('status', AffiliateCommissionStatus::Reversed->value),
            ])
            ->withSum(
                ['commissions as net_commission_amount' => fn ($query) => $query->whereNotIn('status', [
                    AffiliateCommissionStatus::Reversed->value,
                    AffiliateCommissionStatus::Cancelled->value,
                ])],
                'commission_amount',
            )
            ->withSum(
                ['commissions as reversed_commission_amount' => fn ($query) => $query->where('status', AffiliateCommissionStatus::Reversed->value)],
                'commission_amount',
            )
            ->where('affiliate_profile_id', $profile->id)
            ->latest()
            ->paginate(min(max($perPage, 1), 50));
    }

    public function deactivate(AffiliateProfile $profile, AffiliateLink $link): AffiliateLink
    {
        if ($link->affiliate_profile_id !== $profile->id) {
            throw new InvalidArgumentException(__('diyar.affiliate.link_not_owned'));
        }

        $link->update(['is_active' => false]);

        return $link->fresh(['product']);
    }

    public function deactivateForProduct(Product $product): int
    {
        return AffiliateLink::query()
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->update(['is_active' => false]);
    }

    public function buildPublicUrl(AffiliateLink $link): string
    {
        $base = rtrim((string) config('diyar.frontend_url'), '/');

        return "{$base}/product/{$link->product_id}?ref={$link->referral_code}";
    }

    public function findActiveByReferralCode(string $code): ?AffiliateLink
    {
        $link = AffiliateLink::query()
            ->with(['product.affiliateSetting'])
            ->where('referral_code', $code)
            ->where('is_active', true)
            ->first();

        if ($link === null) {
            return null;
        }

        $setting = $link->product?->affiliateSetting;
        if ($setting === null || ! $setting->enabled) {
            return null;
        }

        return $link;
    }
}
