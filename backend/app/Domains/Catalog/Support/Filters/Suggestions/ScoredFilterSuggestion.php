<?php

namespace App\Domains\Catalog\Support\Filters\Suggestions;

final readonly class ScoredFilterSuggestion
{
    public function __construct(
        public FilterSuggestion $suggestion,
        public float $score,
    ) {}
}
