<?php

namespace Tests\Unit\Support\Catalog\Filters\Suggestions;

use App\Support\Catalog\Filters\FilterPresentation;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestion;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionAction;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionApplyMode;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionApplyResolver;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionGroup;
use App\Support\Catalog\Filters\Suggestions\FilterSuggestionReasonCode;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class FilterSuggestionApplyResolverTest extends TestCase
{
    private FilterSuggestionApplyResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();
        $this->resolver = new FilterSuggestionApplyResolver;
    }

    #[Test]
    public function price_range_applies_budget_band_params(): void
    {
        $suggestion = new FilterSuggestion(
            filterKey: 'price_range',
            group: FilterSuggestionGroup::PriceRange,
            presentation: FilterPresentation::Range,
            priority: 1,
            action: FilterSuggestionAction::Narrow,
            reasonCode: FilterSuggestionReasonCode::WidePriceRange,
            queryParameters: ['min_price', 'max_price'],
            bounds: ['min' => 1100.0, 'max' => 3200.0, 'avg' => 2266.67],
        );

        $apply = $this->resolver->resolve($suggestion);

        $this->assertSame(FilterSuggestionApplyMode::Set, $apply->mode);
        $this->assertSame(1100, $apply->set['min_price']);
        $this->assertSame(2267, $apply->set['max_price']);
    }

    #[Test]
    public function start_narrowing_without_values_focuses_manual_filter(): void
    {
        $suggestion = new FilterSuggestion(
            filterKey: 'colors',
            group: FilterSuggestionGroup::Colors,
            presentation: FilterPresentation::MultiSelect,
            priority: 1,
            action: FilterSuggestionAction::Narrow,
            reasonCode: FilterSuggestionReasonCode::StartNarrowing,
            queryParameters: ['colors'],
            source: 'initialized',
        );

        $apply = $this->resolver->resolve($suggestion);

        $this->assertSame(FilterSuggestionApplyMode::Focus, $apply->mode);
        $this->assertSame('colors', $apply->focusFilterKey);
    }

    #[Test]
    public function relax_action_removes_locked_parameters(): void
    {
        $suggestion = new FilterSuggestion(
            filterKey: 'discounted',
            group: FilterSuggestionGroup::Discounted,
            presentation: FilterPresentation::Boolean,
            priority: 1,
            action: FilterSuggestionAction::Relax,
            reasonCode: FilterSuggestionReasonCode::ZeroResultsRelaxFilters,
            queryParameters: ['discounted'],
            values: [['value' => 'true']],
        );

        $apply = $this->resolver->resolve($suggestion);

        $this->assertSame(FilterSuggestionApplyMode::Remove, $apply->mode);
        $this->assertSame(['discounted'], $apply->remove);
    }
}
