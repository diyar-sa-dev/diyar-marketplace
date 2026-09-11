<?php

namespace App\Support\Catalog\Filters\Suggestions;

/**
 * How the suggestion response was resolved.
 *
 * display_mode (ranked | initialized | unavailable) describes WHAT was returned.
 * resolution_path describes HOW it was obtained.
 *
 * Normal successful paths:
 *   fresh_cache, fresh_generate
 *
 * Dependency-degraded paths:
 *   stale_cache, registry_only, disabled, unavailable
 */
enum FilterSuggestionResolutionPath: string
{
    case FreshCache = 'fresh_cache';
    case FreshGenerate = 'fresh_generate';
    case StaleCache = 'stale_cache';
    case RegistryOnly = 'registry_only';
    case Disabled = 'disabled';
    case Unavailable = 'unavailable';

    public function isDependencyDegraded(): bool
    {
        return match ($this) {
            self::FreshCache, self::FreshGenerate => false,
            default => true,
        };
    }
}
