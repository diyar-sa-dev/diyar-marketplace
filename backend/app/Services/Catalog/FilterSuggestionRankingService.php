<?php

namespace App\Services\Catalog;

use App\Support\Catalog\Filters\Context\FilterContext;
use App\Support\Catalog\Filters\Context\FilterContextSummary;
use App\Support\Catalog\Filters\Context\FilterStatisticSummary;
use App\Support\Catalog\Filters\FilterCapability;
use App\Support\Catalog\Filters\FilterCapabilityRegistry;
use App\Support\Catalog\Filters\FilterPresentation;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestion;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionAction;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionGroup;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionEligibility;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionReasonCode;
use App\Support\Catalog\Filters\Suggestions\ScoredFilterSuggestion;

final class FilterSuggestionRankingService
{
    public function __construct(
        private readonly FilterCapabilityRegistry $registry,
        private readonly FilterSuggestionEligibility $eligibility,
    ) {}

    /**
     * @return list<FilterSuggestion>
     */
    public function rank(FilterContext $context, FilterContextSummary $summary): array
    {
        if ($summary->context->resultCount === 0) {
            return $this->relaxSuggestions($context);
        }

        $candidates = [];

        foreach ($this->registry->aiSuggestable($context->contentType) as $capability) {
            if (! $this->isEligible($context, $capability)) {
                continue;
            }

            $candidate = match ($capability->key) {
                'min_price', 'max_price' => null,
                'vendor_slug', 'colors', 'availability_mode', 'discounted', 'pricing_mode', 'remote', 'provider' => $this->scoreDistributionCapability(
                    $summary,
                    $capability,
                ),
                'min_rating' => $this->scoreMinRating($summary, $capability),
                default => null,
            };

            if ($candidate instanceof ScoredFilterSuggestion) {
                $candidates[] = $candidate;
            }
        }

        $priceCandidate = $this->scorePriceRange($context, $summary);
        if ($priceCandidate instanceof ScoredFilterSuggestion) {
            $candidates[] = $priceCandidate;
        }

        return $this->selectDiverseTop($candidates);
    }

    /**
     * @return list<FilterSuggestion>
     */
    private function relaxSuggestions(FilterContext $context): array
    {
        if ($context->activeFilters === []) {
            return [];
        }

        $suggestions = [];

        foreach ($context->activeFilters as $key => $value) {
            $capability = $this->registry->find($this->eligibility->engineKeyToCapabilityKey((string) $key));
            if ($capability === null) {
                continue;
            }

            $group = FilterSuggestionGroup::forCapabilityKey($capability->key);
            if ($group === null) {
                continue;
            }

            $suggestions[] = new FilterSuggestion(
                filterKey: $capability->key,
                group: $group,
                presentation: $capability->presentation,
                priority: count($suggestions) + 1,
                action: FilterSuggestionAction::Relax,
                reasonCode: FilterSuggestionReasonCode::ZeroResultsRelaxFilters,
                queryParameters: $capability->queryParameters,
                values: [['value' => (string) $value]],
            );
        }

        return array_slice($suggestions, 0, $this->maxSuggestions());
    }

    private function scorePriceRange(FilterContext $context, FilterContextSummary $summary): ?ScoredFilterSuggestion
    {
        if ($summary->price === null || $this->eligibility->hasActivePriceFilter($context)) {
            return null;
        }

        $min = $summary->price->min;
        $max = $summary->price->max;
        $avg = max($summary->price->avg, 1.0);

        if ($max <= $min) {
            return null;
        }

        $spreadRatio = ($max - $min) / $avg;
        $threshold = (float) config('diyar.catalog.filter_suggestions.price_range_spread_ratio', 2.5);

        if ($spreadRatio < $threshold) {
            return null;
        }

        $score = min(100.0, $spreadRatio * 18.0) + $this->densityBoost($summary->context->resultDensity);

        return new ScoredFilterSuggestion(
            suggestion: new FilterSuggestion(
                filterKey: 'price_range',
                group: FilterSuggestionGroup::PriceRange,
                presentation: FilterPresentation::Range,
                priority: 0,
                action: FilterSuggestionAction::Narrow,
                reasonCode: FilterSuggestionReasonCode::WidePriceRange,
                queryParameters: ['min_price', 'max_price'],
                bounds: [
                    'min' => round($min, 2),
                    'max' => round($max, 2),
                    'avg' => round($avg, 2),
                ],
            ),
            score: $score,
        );
    }

    private function scoreDistributionCapability(
        FilterContextSummary $summary,
        FilterCapability $capability,
    ): ?ScoredFilterSuggestion {
        $statistic = $summary->filterStatistics[$capability->key] ?? null;
        if (! $statistic instanceof FilterStatisticSummary || $statistic->distinctCount < 2) {
            return null;
        }

        $dominantThreshold = (float) config('diyar.catalog.filter_suggestions.dominant_share_penalty_threshold', 0.85);
        if ($statistic->dominantShare >= $dominantThreshold) {
            return null;
        }

        $score = ($statistic->distributionBalance * 70.0)
            + min(20.0, $statistic->distinctCount * 4.0)
            + $this->densityBoost($summary->context->resultDensity);

        $score *= $this->capabilityWeight($capability->key);

        if (in_array($summary->context->resultDensity, ['very_low', 'low'], true)) {
            $score *= 0.35;
        }

        $reasonCode = match ($capability->key) {
            'discounted' => FilterSuggestionReasonCode::PopularDiscounts,
            'availability_mode' => FilterSuggestionReasonCode::BalancedAvailability,
            'pricing_mode' => FilterSuggestionReasonCode::PricingModeVariety,
            'remote' => FilterSuggestionReasonCode::RemoteOptionsAvailable,
            'provider' => FilterSuggestionReasonCode::ProviderChoice,
            default => FilterSuggestionReasonCode::HighDistributionValue,
        };

        $values = $this->limitValues($statistic->topValues);

        if ($capability->key === 'discounted') {
            $trueShare = ($statistic->distribution['true'] ?? 0) / max($summary->context->resultCount, 1);
            if ($trueShare < 0.15) {
                return null;
            }

            $values = [['value' => 'true', 'count' => $statistic->distribution['true'] ?? 0, 'share' => round($trueShare, 4)]];
        } elseif ($values === []) {
            return null;
        }

        $group = FilterSuggestionGroup::forCapabilityKey($capability->key);
        if ($group === null) {
            return null;
        }

        return new ScoredFilterSuggestion(
            suggestion: new FilterSuggestion(
                filterKey: $capability->key,
                group: $group,
                presentation: $capability->presentation,
                priority: 0,
                action: FilterSuggestionAction::Narrow,
                reasonCode: $reasonCode,
                queryParameters: $capability->queryParameters,
                values: $values,
            ),
            score: $score,
        );
    }

    private function scoreMinRating(
        FilterContextSummary $summary,
        FilterCapability $capability,
    ): ?ScoredFilterSuggestion {
        if ($summary->rating === null || $summary->rating->avg < 3.5) {
            return null;
        }

        $suggestedThreshold = $summary->rating->avg >= 4.5 ? 4.5 : 4.0;
        $score = ($summary->rating->avg * 15.0) + $this->densityBoost($summary->context->resultDensity);

        if (in_array($summary->context->resultDensity, ['very_low', 'low'], true)) {
            $score *= 0.35;
        }

        return new ScoredFilterSuggestion(
            suggestion: new FilterSuggestion(
                filterKey: $capability->key,
                group: FilterSuggestionGroup::MinRating,
                presentation: $capability->presentation,
                priority: 0,
                action: FilterSuggestionAction::Narrow,
                reasonCode: FilterSuggestionReasonCode::HighlyRatedProviders,
                queryParameters: $capability->queryParameters,
                values: [['value' => (string) $suggestedThreshold]],
            ),
            score: $score,
        );
    }

    private function isEligible(FilterContext $context, FilterCapability $capability): bool
    {
        return $capability->aiSuggestable && $this->eligibility->isEligible($context, $capability);
    }

    /**
     * @param  list<array{value: string, count: int, share: float}>  $values
     * @return list<array{value: string, count: int, share: float}>
     */
    private function limitValues(array $values): array
    {
        $limit = (int) config('diyar.catalog.filter_suggestions.max_values_per_suggestion', 5);

        return array_slice($values, 0, $limit);
    }

    /**
     * @param  list<ScoredFilterSuggestion>  $candidates
     * @return list<FilterSuggestion>
     */
    private function selectDiverseTop(array $candidates): array
    {
        usort($candidates, static fn (ScoredFilterSuggestion $a, ScoredFilterSuggestion $b): int => $b->score <=> $a->score);

        $selected = [];
        $usedGroups = [];

        foreach ($candidates as $candidate) {
            $groupKey = $candidate->suggestion->group->value;

            if (isset($usedGroups[$groupKey])) {
                continue;
            }

            $usedGroups[$groupKey] = true;
            $base = $candidate->suggestion;

            $selected[] = new FilterSuggestion(
                filterKey: $base->filterKey,
                group: $base->group,
                presentation: $base->presentation,
                priority: count($selected) + 1,
                action: $base->action,
                reasonCode: $base->reasonCode,
                queryParameters: $base->queryParameters,
                values: $base->values,
                bounds: $base->bounds,
                source: 'ranked',
            );

            if (count($selected) >= $this->maxSuggestions()) {
                break;
            }
        }

        return $selected;
    }

    private function densityBoost(string $density): float
    {
        return match ($density) {
            'very_high', 'high' => 15.0,
            'medium' => 8.0,
            'low' => 0.0,
            'very_low' => -10.0,
            default => -20.0,
        };
    }

    private function capabilityWeight(string $key): float
    {
        $weights = config('diyar.catalog.filter_suggestions.weights', []);

        return (float) ($weights[$key] ?? 1.0);
    }

    private function maxSuggestions(): int
    {
        return (int) config('diyar.catalog.filter_suggestions.max_suggestions', 5);
    }

}
