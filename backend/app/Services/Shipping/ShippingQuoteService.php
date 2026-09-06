<?php

namespace App\Services\Shipping;

use App\Enums\ShippingMethod;
use App\Models\VendorShippingProfile;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\DTO\ShippingQuote;
use App\Services\Shipping\DTO\ShippingQuoteContext;
use App\Services\Shipping\Strategies\CarrierFlatRateStrategy;
use App\Services\Shipping\Strategies\PickupStrategy;
use App\Services\Shipping\Strategies\ShippingMethodStrategy;
use InvalidArgumentException;

final class ShippingQuoteService
{
    /** @var array<string, ShippingMethodStrategy> */
    private array $strategies;

    public function __construct(
        ?CarrierFlatRateStrategy $carrier = null,
        ?PickupStrategy $pickup = null,
        private readonly ?ShippingRuleEngine $ruleEngine = null,
    ) {
        $carrier ??= new CarrierFlatRateStrategy;
        $pickup ??= new PickupStrategy;

        $this->strategies = [
            ShippingMethod::Carrier->value => $carrier,
            ShippingMethod::Pickup->value => $pickup,
        ];
    }

    public function quoteVendorGroup(
        VendorShippingSettings $settings,
        ShippingMethod $method,
        string $vendorSubtotal,
        ?ShippingQuoteContext $context = null,
    ): ShippingQuote {
        if ($method === ShippingMethod::Carrier && $settings->use_advanced_rules && $context !== null) {
            return $this->quoteAdvancedCarrier($settings, $vendorSubtotal, $context);
        }

        $strategy = $this->strategies[$method->value] ?? null;

        if ($strategy === null) {
            throw new InvalidArgumentException(__('diyar.shipping.invalid_method'));
        }

        return $strategy->quote($settings, $vendorSubtotal);
    }

    /**
     * @return list<ShippingMethod>
     */
    public function availableMethods(VendorShippingSettings $settings): array
    {
        $methods = [];

        if ($settings->carrier_enabled) {
            $methods[] = ShippingMethod::Carrier;
        }

        if ($settings->pickup_enabled) {
            $methods[] = ShippingMethod::Pickup;
        }

        return $methods;
    }

    private function quoteAdvancedCarrier(
        VendorShippingSettings $settings,
        string $vendorSubtotal,
        ShippingQuoteContext $context,
    ): ShippingQuote {
        $settings->loadMissing('shippingProfile.shippingMethod.carrier');
        $profile = $settings->shippingProfile;

        if ($profile === null || ! $profile->is_active) {
            $profile = VendorShippingProfile::query()
                ->where('vendor_account_id', $settings->vendor_account_id)
                ->where('is_default', true)
                ->where('is_active', true)
                ->with('shippingMethod.carrier')
                ->first();
        }

        if ($profile === null) {
            throw new InvalidArgumentException(__('diyar.shipping.profile_not_configured'));
        }

        $zone = $this->ruleEngine()->resolveZoneForProfile($profile, $context->address);
        $resolved = $this->ruleEngine()->resolveRate(
            $settings,
            $vendorSubtotal,
            $zone,
            $context->cartItems,
            $profile,
            $context->preloadedRules,
        );

        $freeApplied = bccomp($resolved['rate'], '0.00', 2) === 0
            && $resolved['free_threshold'] !== null
            && bccomp($vendorSubtotal, $resolved['free_threshold'], 2) >= 0;

        return new ShippingQuote(
            method: ShippingMethod::Carrier,
            shippingCost: $resolved['rate'],
            freeShippingApplied: $freeApplied,
            pickupLocationLabel: null,
            deliveryEstimateDays: $resolved['delivery_estimate_days'],
            billableWeightKg: $resolved['billable_weight_kg'],
        );
    }

    private function ruleEngine(): ShippingRuleEngine
    {
        return $this->ruleEngine ?? app(ShippingRuleEngine::class);
    }
}
