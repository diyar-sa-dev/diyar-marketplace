<?php

namespace App\Domains\Catalog\Support\Filters\Suggestions;

enum FilterSuggestionAction: string
{
    case Narrow = 'narrow';
    case Relax = 'relax';
}
