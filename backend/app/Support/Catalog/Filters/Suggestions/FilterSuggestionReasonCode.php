<?php

namespace App\Support\Catalog\Filters\Suggestions;

enum FilterSuggestionReasonCode: string
{
    case HighDistributionValue = 'high_distribution_value';
    case WidePriceRange = 'wide_price_range';
    case PopularDiscounts = 'popular_discounts';
    case BalancedAvailability = 'balanced_availability';
    case HighlyRatedProviders = 'highly_rated_providers';
    case RemoteOptionsAvailable = 'remote_options_available';
    case PricingModeVariety = 'pricing_mode_variety';
    case ProviderChoice = 'provider_choice';
    case ZeroResultsRelaxFilters = 'zero_results_relax_filters';
    case LowResultsAvoidNarrowing = 'low_results_avoid_narrowing';
    case StartNarrowing = 'start_narrowing';
}
