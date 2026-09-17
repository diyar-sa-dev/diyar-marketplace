<?php

namespace App\Support\Catalog\Filters\Suggestions;

enum FilterSuggestionAction: string
{
    case Narrow = 'narrow';
    case Relax = 'relax';
}
