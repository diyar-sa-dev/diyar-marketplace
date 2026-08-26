<?php

namespace App\Services\Shipping;

use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class ShippingRuleEngine
{
    public function __construct(
        private readonly ZoneResolver $zones,
        private readonly ShippingWeightCalculator $weights,
    ) {}

    /**
     * @param  Collection<int, ShippingRateRule>|null  $preloadedRules
     * @return array{rate: string, handling_fee: string, free_threshold: ?string, delivery_estimate_days: ?int, billable_weight_kg: string}
     */
    public function resolveRate(
        VendorShippingSettings $settings,
        string $vendorSubtotal,
        ShippingZone $zone,
        Collection $cartItems,
        VendorShippingProfile $profile,
        ?Collection $preloadedRules = null,
    ): array {
        $profile->loadMissing('shippingMethod');
        $method = $profile->shippingMethod;

        if ($method === null || ! $method->is_active) {
            Log::warning('shipping_rule_failed', [
                'reason' => 'missing_method',
                'vendor_account_id' => $settings->vendor_account_id,
            ]);
            throw new UnprocessableEntityHttpException(__('diyar.shipping.method_not_available'));
        }

        $divisor = $profile->volumetric_divisor ?? (int) config('diyar.shipping.default_volumetric_divisor', 5000);
        $billableWeight = $this->weights->calculateBillableWeight($cartItems, $divisor);

        $rules = $preloadedRules ?? ShippingRateRule::query()
            ->where('shipping_method_id', $method->id)
            ->where('is_active', true)
            ->where(function ($query) use ($zone): void {
                $query->whereNull('zone_id')->orWhere('zone_id', $zone->id);
            })
            ->where(function ($query) use ($settings): void {
                $query->whereNull('vendor_account_id')
                    ->orWhere('vendor_account_id', $settings->vendor_account_id);
            })
            ->get();

        if ($preloadedRules !== null) {
            $rules = $preloadedRules
                ->filter(fn (ShippingRateRule $rule) => $rule->is_active
                    && ($rule->zone_id === null || $rule->zone_id === $zone->id)
                    && ($rule->vendor_account_id === null || $rule->vendor_account_id === $settings->vendor_account_id));
        }

        $matched = $rules
            ->filter(fn (ShippingRateRule $rule) => $this->matchesRule($rule, $billableWeight, $vendorSubtotal))
            ->sort(function (ShippingRateRule $a, ShippingRateRule $b): int {
                $scoreCompare = $this->ruleSpecificityScore($b) <=> $this->ruleSpecificityScore($a);
                if ($scoreCompare !== 0) {
                    return $scoreCompare;
                }

                $priorityCompare = ((int) $a->sort_order) <=> ((int) $b->sort_order);
                if ($priorityCompare !== 0) {
                    return $priorityCompare;
                }

                return strcmp((string) $a->id, (string) $b->id);
            })
            ->first();

        if ($matched === null) {
            Log::warning('shipping_quote_failed', [
                'reason' => 'no_matching_rule',
                'vendor_account_id' => $settings->vendor_account_id,
                'zone_id' => $zone->id,
                'weight_kg' => $billableWeight,
            ]);
            throw new UnprocessableEntityHttpException(__('diyar.shipping.unsupported_zone'));
        }

        $freeThreshold = $matched->free_shipping_threshold ?? $profile->free_shipping_threshold;
        $handling = bcadd((string) $matched->handling_fee, (string) $profile->handling_fee, 2);
        $rate = bcadd((string) $matched->rate, '0', 2);
        $cost = bcadd($rate, $handling, 2);

        if ($freeThreshold !== null && bccomp($vendorSubtotal, (string) $freeThreshold, 2) >= 0) {
            $cost = '0.00';
        }

        return [
            'rate' => $cost,
            'handling_fee' => $handling,
            'free_threshold' => $freeThreshold !== null ? (string) $freeThreshold : null,
            'delivery_estimate_days' => $matched->delivery_estimate_days ?? $profile->delivery_estimate_days,
            'billable_weight_kg' => $billableWeight,
        ];
    }

    public function resolveZoneForProfile(VendorShippingProfile $profile, $address): ShippingZone
    {
        $profile->loadMissing('shippingMethod.carrier');
        $carrier = $profile->shippingMethod?->carrier;

        if ($carrier === null) {
            throw new UnprocessableEntityHttpException(__('diyar.shipping.method_not_available'));
        }

        $zone = $this->zones->resolveBestZone($carrier->id, $address);

        if ($zone === null) {
            Log::warning('shipping_quote_failed', [
                'reason' => 'unsupported_zone',
                'carrier_id' => $carrier->id,
                'city' => $address->city,
            ]);
            throw new UnprocessableEntityHttpException(__('diyar.shipping.unsupported_zone'));
        }

        return $zone;
    }

    private function matchesRule(ShippingRateRule $rule, string $weightKg, string $subtotal): bool
    {
        if (bccomp($weightKg, (string) $rule->min_weight_kg, 3) < 0) {
            return false;
        }

        if ($rule->max_weight_kg !== null && bccomp($weightKg, (string) $rule->max_weight_kg, 3) > 0) {
            return false;
        }

        if (bccomp($subtotal, (string) $rule->min_subtotal, 2) < 0) {
            return false;
        }

        if ($rule->max_subtotal !== null && bccomp($subtotal, (string) $rule->max_subtotal, 2) > 0) {
            return false;
        }

        return true;
    }

    private function ruleSpecificityScore(ShippingRateRule $rule): int
    {
        $score = 0;

        if ($rule->vendor_account_id !== null) {
            $score += 100;
        }

        if ($rule->zone_id !== null) {
            $score += 50;
        }

        $score += $this->bandNarrownessScore($rule);

        return $score;
    }

    private function bandNarrownessScore(ShippingRateRule $rule): int
    {
        $score = 0;

        if ($rule->max_weight_kg !== null) {
            $range = bcsub((string) $rule->max_weight_kg, (string) $rule->min_weight_kg, 3);
            if (bccomp($range, '0', 3) > 0 && bccomp($range, '1000', 3) < 0) {
                $score += max(0, 20 - (int) bcmul($range, '1', 0));
            }
        }

        if ($rule->max_subtotal !== null) {
            $range = bcsub((string) $rule->max_subtotal, (string) $rule->min_subtotal, 2);
            if (bccomp($range, '0', 2) > 0 && bccomp($range, '1000000', 2) < 0) {
                $score += max(0, 10 - (int) bcdiv($range, '1000', 0));
            }
        }

        return $score;
    }
}
