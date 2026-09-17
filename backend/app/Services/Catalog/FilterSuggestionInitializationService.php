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
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionEligibility;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionGroup;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionReasonCode;
use App\Support\Catalog\Filters\Suggestions\ScoredFilterSuggestion;

final class FilterSuggestionInitializationService
{
    public function __construct(
        private readonly FilterCapabilityRegistry $registry,
        private readonly FilterSuggestionEligibility $eligibility,
    ) {}

    /**
     * @param  list<string>  $excludeGroups  Group values already covered by ranked suggestions.
     * @return list<FilterSuggestion>
     */
    public function initialize(
        FilterContext $context,
        FilterContextSummary $summary,
        array $excludeGroups = [],
    ): array {
        $excluded = array_fill_keys($excludeGroups, true);
        $candidates = [];

        if (! isset($excluded[FilterSuggestionGroup::PriceRange->value]) && ! $this->eligibility->hasActivePriceFilter($context)) {
            $priceScore = 100.0;
            if ($summary->price !== null) {
                $priceScore += 20.0;
            }

            if ($summary->context->resultCount === 0 && $context->activeFilters !== []) {
                $priceScore *= 0.5;
            }

            $candidates[] = new ScoredFilterSuggestion(
                suggestion: $this->buildInitializedSuggestion(
                    filterKey: 'price_range',
                    group: FilterSuggestionGroup::PriceRange,
                    presentation: FilterPresentation::Range,
                    queryParameters: ['min_price', 'max_price'],
                    bounds: $summary->price !== null ? [
                        'min' => round($summary->price->min, 2),
                        'max' => round($summary->price->max, 2),
                        'avg' => round($summary->price->avg, 2),
                    ] : null,
                ),
                score: $priceScore,
            );
        }

        foreach ($this->registry->aiSuggestable($context->contentType) as $capability) {
            if (in_array($capability->key, ['min_price', 'max_price'], true)) {
                continue;
            }

            if (! $this->eligibility->isEligible($context, $capability)) {
                continue;
            }

            $group = FilterSuggestionGroup::forCapabilityKey($capability->key);
            if ($group === null || isset($excluded[$group->value])) {
                continue;
            }

            if (! $this->isUiInitializable($capability)) {
                continue;
            }

            $score = $this->scoreInitialization($context, $summary, $capability);
            if ($score <= 0) {
                continue;
            }

            $statistic = $summary->filterStatistics[$capability->key] ?? null;
            $values = [];

            if ($statistic instanceof FilterStatisticSummary && $statistic->topValues !== []) {
                $values = array_slice($statistic->topValues, 0, 1);
            }

            if ($capability->key === 'min_rating' && $summary->rating !== null && $summary->rating->avg >= 3.5) {
                $values = [['value' => $summary->rating->avg >= 4.5 ? '4.5' : '4.0']];
            }

            $candidates[] = new ScoredFilterSuggestion(
                suggestion: $this->buildInitializedSuggestion(
                    filterKey: $capability->key,
                    group: $group,
                    presentation: $capability->presentation,
                    queryParameters: $capability->queryParameters,
                    values: $values,
                ),
                score: $score,
            );
        }

        return $this->selectDiverseTop($candidates);
    }

    private function buildInitializedSuggestion(
        string $filterKey,
        FilterSuggestionGroup $group,
        FilterPresentation $presentation,
        array $queryParameters,
        ?array $bounds = null,
        array $values = [],
    ): FilterSuggestion {
        return new FilterSuggestion(
            filterKey: $filterKey,
            group: $group,
            presentation: $presentation,
            priority: 0,
            action: FilterSuggestionAction::Narrow,
            reasonCode: FilterSuggestionReasonCode::StartNarrowing,
            queryParameters: $queryParameters,
            values: $values,
            bounds: $bounds,
            source: 'initialized',
        );
    }

    private function isUiInitializable(FilterCapability $capability): bool
    {
        return match ($capability->presentation) {
            FilterPresentation::Hidden, FilterPresentation::Text => false,
            default => true,
        };
    }

    private function scoreInitialization(
        FilterContext $context,
        FilterContextSummary $summary,
        FilterCapability $capability,
    ): float {
        $weights = config('diyar.catalog.filter_suggestions.initialization_weights', []);
        $score = (float) ($weights[$capability->key] ?? 50.0);

        $statistic = $summary->filterStatistics[$capability->key] ?? null;
        if ($statistic instanceof FilterStatisticSummary && $statistic->distinctCount >= 2) {
            $score += 25.0;
        }

        if ($capability->key === 'min_rating' && $summary->rating !== null && $summary->rating->avg >= 3.5) {
            $score += 20.0;
        }

        if ($summary->context->resultCount === 0) {
            $score *= $context->activeFilters === [] ? 0.85 : 0.4;
        }

        if (in_array($summary->context->resultDensity, ['very_low', 'low'], true)) {
            if (in_array($capability->key, ['discounted', 'availability_mode', 'remote', 'vendor_slug'], true)) {
                $score *= 0.65;
            }
        }

        return $score;
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
                source: $base->source,
            );

            if (count($selected) >= $this->maxInitialized()) {
                break;
            }
        }

        return $selected;
    }

    private function maxInitialized(): int
    {
        return (int) config('diyar.catalog.filter_suggestions.max_initialized_filters', 4);
    }
}
