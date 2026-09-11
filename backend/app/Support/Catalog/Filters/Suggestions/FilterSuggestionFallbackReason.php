<?php

namespace App\Support\Catalog\Filters\Suggestions;

enum FilterSuggestionFallbackReason: string
{
    case StaleCache = 'stale_cache';
    case RegistryOnly = 'registry_only';
    case DependencyFailure = 'dependency_failure';
    case Disabled = 'disabled';
    case Unavailable = 'unavailable';
}
