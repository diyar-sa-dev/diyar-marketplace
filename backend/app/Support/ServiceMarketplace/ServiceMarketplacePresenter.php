<?php

namespace App\Support\ServiceMarketplace;

use App\Enums\ServicePricingMode;
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
}
