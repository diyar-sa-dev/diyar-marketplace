<?php

namespace Tests\Unit\Support\Catalog\Filters\Suggestions;

use App\Support\Catalog\Filters\FilterPresentation;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestion;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionAction;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionApply;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionApplyMode;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionGroup;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionReasonCode;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionResult;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterSuggestionResultCacheCodecTest extends TestCase
{
    #[Test]
    public function filter_suggestion_result_survives_php_serialization_round_trip(): void
    {
        $result = new FilterSuggestionResult(
            contentType: 'product',
            resultCount: 42,
            resultDensity: 'medium',
            suggestions: [
                new FilterSuggestion(
                    filterKey: 'price',
                    group: FilterSuggestionGroup::PriceRange,
                    presentation: FilterPresentation::Range,
                    priority: 10,
                    action: FilterSuggestionAction::Narrow,
                    reasonCode: FilterSuggestionReasonCode::HighDistributionValue,
                    queryParameters: ['price_min', 'price_max'],
                    values: [],
                    bounds: ['min' => 10.0, 'max' => 500.0],
                    label: 'Price',
                    apply: new FilterSuggestionApply(
                        mode: FilterSuggestionApplyMode::Set,
                        set: ['price_min' => 50],
                    ),
                    source: 'ranked',
                ),
            ],
            initializedFilters: [
                new FilterSuggestion(
                    filterKey: 'rating',
                    group: FilterSuggestionGroup::MinRating,
                    presentation: FilterPresentation::Minimum,
                    priority: 5,
                    action: FilterSuggestionAction::Narrow,
                    reasonCode: FilterSuggestionReasonCode::StartNarrowing,
                    queryParameters: ['rating_min'],
                    source: 'initialized',
                ),
            ],
            displayMode: 'initialized',
            degraded: false,
            fallbackReason: null,
            resolutionPath: 'fresh_generate',
        );

        $payload = $result->toArray();
        $serialized = serialize($payload);
        $restored = FilterSuggestionResult::fromArray(unserialize($serialized));

        $this->assertSame($result->contentType, $restored->contentType);
        $this->assertSame($result->resultCount, $restored->resultCount);
        $this->assertSame($result->displayMode, $restored->displayMode);
        $this->assertSame($result->resolutionPath, $restored->resolutionPath);
        $this->assertCount(1, $restored->suggestions);
        $this->assertSame('price', $restored->suggestions[0]->filterKey);
        $this->assertCount(1, $restored->initializedFilters);
        $this->assertSame('rating', $restored->initializedFilters[0]->filterKey);
    }
}
