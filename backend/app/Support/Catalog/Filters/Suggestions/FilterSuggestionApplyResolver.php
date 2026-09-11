<?php

namespace App\Support\Catalog\Filters\Suggestions;

use App\Support\Catalog\Filters\FilterPresentation;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionReasonCode;

final class FilterSuggestionApplyResolver
{
    public function resolve(FilterSuggestion $suggestion): FilterSuggestionApply
    {
        if ($suggestion->action === FilterSuggestionAction::Relax) {
            return new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Remove,
                remove: $suggestion->queryParameters,
            );
        }

        if ($suggestion->reasonCode === FilterSuggestionReasonCode::StartNarrowing && $suggestion->values === []) {
            return new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Focus,
                focusFilterKey: $suggestion->filterKey,
            );
        }

        return match ($suggestion->filterKey) {
            'price_range' => $this->resolvePriceRange($suggestion),
            'discounted' => new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Set,
                set: ['discounted' => true],
            ),
            'remote' => $this->resolveBooleanTopValue($suggestion, 'remote'),
            'min_rating' => $this->resolveMinRating($suggestion),
            default => $this->resolveDiscreteTopValue($suggestion),
        };
    }

    private function resolvePriceRange(FilterSuggestion $suggestion): FilterSuggestionApply
    {
        $bounds = $suggestion->bounds;
        if ($bounds === null) {
            return new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Focus,
                focusFilterKey: 'price_range',
            );
        }

        $min = (float) ($bounds['min'] ?? 0);
        $max = (float) ($bounds['max'] ?? 0);
        $avg = (float) ($bounds['avg'] ?? $max);

        if ($max <= $min) {
            return new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Focus,
                focusFilterKey: 'price_range',
            );
        }

        $suggestedMax = (float) round(min($max, max($avg, $min + 1)));

        return new FilterSuggestionApply(
            mode: FilterSuggestionApplyMode::Set,
            set: [
                'min_price' => (int) round($min),
                'max_price' => (int) round($suggestedMax),
            ],
        );
    }

    private function resolveMinRating(FilterSuggestion $suggestion): FilterSuggestionApply
    {
        $value = $suggestion->values[0]['value'] ?? '4';

        return new FilterSuggestionApply(
            mode: FilterSuggestionApplyMode::Set,
            set: ['min_rating' => (float) $value],
        );
    }

    private function resolveBooleanTopValue(FilterSuggestion $suggestion, string $key): FilterSuggestionApply
    {
        $value = $suggestion->values[0]['value'] ?? 'true';

        return new FilterSuggestionApply(
            mode: FilterSuggestionApplyMode::Set,
            set: [$key => filter_var($value, FILTER_VALIDATE_BOOLEAN)],
        );
    }

    private function resolveDiscreteTopValue(FilterSuggestion $suggestion): FilterSuggestionApply
    {
        if ($suggestion->values === []) {
            return new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Focus,
                focusFilterKey: $suggestion->filterKey,
            );
        }

        $topValue = (string) $suggestion->values[0]['value'];
        $param = match ($suggestion->filterKey) {
            'vendor_slug' => 'vendor_slug',
            'colors' => 'colors',
            'availability_mode' => 'availability_mode',
            'pricing_mode' => 'pricing_mode',
            'provider' => 'provider',
            default => $suggestion->queryParameters[0] ?? $suggestion->filterKey,
        };

        if ($suggestion->presentation === FilterPresentation::MultiSelect && $param === 'colors') {
            return new FilterSuggestionApply(
                mode: FilterSuggestionApplyMode::Set,
                set: ['colors' => $topValue],
            );
        }

        return new FilterSuggestionApply(
            mode: FilterSuggestionApplyMode::Set,
            set: [$param => $topValue],
        );
    }
}
