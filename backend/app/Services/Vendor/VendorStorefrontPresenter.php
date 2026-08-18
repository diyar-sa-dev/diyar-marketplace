<?php

namespace App\Services\Vendor;

use App\Enums\ProductStatus;
use App\Enums\Weekday;
use App\Models\VendorAccount;
use App\Models\VendorReturnPolicy;
use App\Models\VendorShippingSettings;
use App\Models\VendorWorkingHour;

final class VendorStorefrontPresenter
{
    /**
     * @return list<string>
     */
    public function returnPolicySummary(?VendorReturnPolicy $policy): array
    {
        if ($policy === null || ! $policy->returnable) {
            return [__('diyar.vendor.storefront.return_not_available')];
        }

        $lines = [
            __('diyar.vendor.storefront.return_window', [
                'days' => $policy->return_window_days,
            ]),
        ];

        if ($policy->requires_unused) {
            $lines[] = __('diyar.vendor.storefront.return_unused_required');
        }

        if ($policy->requires_evidence) {
            $lines[] = __('diyar.vendor.storefront.return_evidence_required');
        }

        if ($policy->shipping_refundable) {
            $lines[] = __('diyar.vendor.storefront.return_shipping_refundable');
        }

        return $lines;
    }

    /**
     * @return list<string>
     */
    public function shippingSummary(?VendorShippingSettings $settings): array
    {
        if ($settings === null) {
            return [];
        }

        $lines = [];

        if ($settings->carrier_enabled) {
            if ($settings->carrier_free_shipping_enabled && $settings->carrier_free_shipping_threshold !== null) {
                $lines[] = __('diyar.vendor.storefront.free_shipping_threshold', [
                    'amount' => number_format((float) $settings->carrier_free_shipping_threshold, 2, '.', ''),
                ]);
            }

            if ($settings->carrier_flat_rate !== null) {
                $lines[] = __('diyar.vendor.storefront.carrier_flat_rate', [
                    'amount' => number_format((float) $settings->carrier_flat_rate, 2, '.', ''),
                ]);
            }
        }

        if ($settings->pickup_enabled && $settings->pickup_location_label) {
            $lines[] = __('diyar.vendor.storefront.pickup_available', [
                'location' => $settings->pickup_location_label,
            ]);
        }

        return $lines;
    }

    /**
     * @param  iterable<VendorWorkingHour>  $hours
     * @return list<array{day: string, label: string, is_closed: bool, opens_at: string|null, closes_at: string|null, closes_next_day: bool}>
     */
    public function workingHours(iterable $hours): array
    {
        $order = array_flip(Weekday::values());
        $items = collect($hours)
            ->sortBy(fn ($hour) => $order[$hour->day->value] ?? 99)
            ->values();

        $result = [];

        foreach ($items as $hour) {
            $opensAt = $hour->opens_at !== null ? substr((string) $hour->opens_at, 0, 5) : null;
            $closesAt = $hour->closes_at !== null ? substr((string) $hour->closes_at, 0, 5) : null;

            $result[] = [
                'day' => $hour->day->value,
                'label' => __("diyar.vendor.weekdays.{$hour->day->value}"),
                'is_closed' => (bool) $hour->is_closed,
                'opens_at' => $opensAt,
                'closes_at' => $closesAt,
                'closes_next_day' => (bool) $hour->closes_next_day,
            ];
        }

        return $result;
    }

    public function productsCount(VendorAccount $vendor): int
    {
        return $vendor->products()
            ->where('status', ProductStatus::Active->value)
            ->whereNull('deleted_at')
            ->count();
    }
}
