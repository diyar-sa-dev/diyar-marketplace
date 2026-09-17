<?php

namespace App\Support\Catalog\Filters\Suggestions;

final readonly class ScoredFilterSuggestion
{
    public function __construct(
        public FilterSuggestion $suggestion,
        public float $score,
    ) {}
}
