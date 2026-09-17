<?php

namespace App\Support\Catalog\Filters\Suggestions;

enum FilterSuggestionGroup: string
{
    case PriceRange = 'price_range';
    case Vendor = 'vendor_slug';
    case Colors = 'colors';
    case Availability = 'availability_mode';
    case Discounted = 'discounted';
    case PricingMode = 'pricing_mode';
    case MinRating = 'min_rating';
    case Remote = 'remote';
    case Provider = 'provider';

    public static function forCapabilityKey(string $key): ?self
    {
        return match ($key) {
            'min_price', 'max_price' => self::PriceRange,
            'vendor_slug' => self::Vendor,
            'colors' => self::Colors,
            'availability_mode' => self::Availability,
            'discounted' => self::Discounted,
            'pricing_mode' => self::PricingMode,
            'min_rating' => self::MinRating,
            'remote' => self::Remote,
            'provider' => self::Provider,
            default => null,
        };
    }
}
