<?php

namespace App\Support\ServiceMarketplace;

use App\Enums\ServicePricingMode;
use App\Enums\Weekday;
use App\Models\ProviderWorkPolicy;
use App\Services\Media\MediaUploadService;

final class ServiceMarketplacePresenter
{
    public function __construct(
        private readonly MediaUploadService $media,
    ) {}

    public function mediaUrl(?string $path): ?string
    {
        if ($path === null || $path === '') {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        return $this->media->url($path);
    }

    public function pricingLabel(ServicePricingMode $mode, ?float $price, string $currency = 'SAR'): ?string
    {
        if ($price === null) {
            return $mode === ServicePricingMode::CustomQuote
                ? __('diyar.services.pricing.custom_quote')
                : null;
        }

        $formatted = number_format($price, 0, '.', ',');

        return match ($mode) {
            ServicePricingMode::Fixed => __('diyar.services.pricing.fixed', ['price' => $formatted, 'currency' => $currency]),
            ServicePricingMode::StartingFrom => __('diyar.services.pricing.starting_from', ['price' => $formatted, 'currency' => $currency]),
            ServicePricingMode::Hourly => __('diyar.services.pricing.hourly', ['price' => $formatted, 'currency' => $currency]),
            ServicePricingMode::PerSqm => __('diyar.services.pricing.per_sqm', ['price' => $formatted, 'currency' => $currency]),
            ServicePricingMode::PerProject => __('diyar.services.pricing.per_project', ['price' => $formatted, 'currency' => $currency]),
            ServicePricingMode::CustomQuote => __('diyar.services.pricing.custom_quote'),
        };
    }

    /**
     * @param  array<int, array<string, mixed>>|null  $hours
     * @return array<int, array<string, mixed>>
     */
    public function formatWorkingHours(?array $hours): array
    {
        if ($hours === null || $hours === []) {
            return [];
        }

        $order = array_flip(Weekday::values());
        usort(
            $hours,
            fn (array $a, array $b) => ($order[(string) ($a['day'] ?? '')] ?? 99) <=> ($order[(string) ($b['day'] ?? '')] ?? 99),
        );

        $result = [];

        foreach ($hours as $hour) {
            $day = (string) ($hour['day'] ?? '');
            if ($day === '') {
                continue;
            }

            $isClosed = (bool) ($hour['is_closed'] ?? false);
            $opensAt = $hour['opens_at'] ?? null;
            $closesAt = $hour['closes_at'] ?? null;

            $result[] = [
                'day' => $day,
                'label' => __("diyar.vendor.weekdays.{$day}"),
                'is_closed' => $isClosed,
                'opens_at' => $isClosed || $opensAt === null ? null : substr((string) $opensAt, 0, 5),
                'closes_at' => $isClosed || $closesAt === null ? null : substr((string) $closesAt, 0, 5),
                'closes_next_day' => $isClosed ? false : (bool) ($hour['closes_next_day'] ?? false),
            ];
        }

        return $result;
    }

    /**
     * @return list<string>
     */
    public function workPolicySummary(?ProviderWorkPolicy $policy): array
    {
        if ($policy === null || ! $policy->policy_enabled) {
            return [];
        }

        $lines = [];

        if ($policy->initial_delivery_days > 0) {
            $lines[] = __('diyar.services.storefront.initial_delivery', [
                'days' => $policy->initial_delivery_days,
            ]);
        }

        if ($policy->free_revisions_included > 0) {
            $lines[] = __('diyar.services.storefront.free_revisions', [
                'count' => $policy->free_revisions_included,
            ]);
        }

        if ($policy->timeline_by_project_scope) {
            $lines[] = __('diyar.services.storefront.timeline_by_scope');
        }

        if ($policy->cancellation_notice_hours !== null && $policy->cancellation_notice_hours > 0) {
            $lines[] = __('diyar.services.storefront.cancellation_notice', [
                'hours' => $policy->cancellation_notice_hours,
            ]);
        }

        foreach ($policy->custom_terms ?? [] as $term) {
            $trimmed = trim((string) $term);
            if ($trimmed !== '') {
                $lines[] = $trimmed;
            }
        }

        return $lines;
    }
}
