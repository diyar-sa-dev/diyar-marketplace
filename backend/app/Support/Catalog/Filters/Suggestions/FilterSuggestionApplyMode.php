<?php

namespace App\Support\Catalog\Filters\Suggestions;

enum FilterSuggestionApplyMode: string
{
    /** Merge params into the current catalog filter URL state. */
    case Set = 'set';

    /** Remove listed query parameters from the current filter state. */
    case Remove = 'remove';

    /** Open the manual filter control for the given filter (e.g. price range). */
    case Focus = 'focus';
}
