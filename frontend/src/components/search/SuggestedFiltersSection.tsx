import React, { useMemo } from 'react';
import { AlertCircle, MinusCircle, SlidersHorizontal, Sparkles, Target } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import type {
  FilterSuggestionDisplayMode,
  FilterSuggestionItem,
} from '../../types/filterSuggestions.ts';

function SuggestionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden="true">
      <div className="h-4 w-40 rounded bg-gray-200" />
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-10 w-24 rounded-xl bg-gray-100" />
        ))}
      </div>
    </div>
  );
}

interface SuggestedFiltersSectionProps {
  suggestions: FilterSuggestionItem[];
  initializedFilters?: FilterSuggestionItem[];
  displayMode?: FilterSuggestionDisplayMode;
  degraded?: boolean;
  isEnabled?: boolean;
  isLoading: boolean;
  isError: boolean;
  isRefetching?: boolean;
  onRetry?: () => void;
  onSelect: (suggestion: FilterSuggestionItem) => void;
  onFocusManual?: (filterKey: string) => void;
  compact?: boolean;
}

export function SuggestedFiltersSection({
  suggestions,
  initializedFilters = [],
  displayMode = 'unavailable',
  degraded = false,
  isEnabled = true,
  isLoading,
  isError,
  isRefetching = false,
  onRetry,
  onSelect,
  onFocusManual,
  compact = false,
}: SuggestedFiltersSectionProps) {
  const { t } = useLocale();

  const activeItems = useMemo(() => {
    if (displayMode === 'ranked' && suggestions.length > 0) {
      return suggestions;
    }

    if (displayMode === 'initialized' && initializedFilters.length > 0) {
      return initializedFilters;
    }

    if (initializedFilters.length > 0) {
      return initializedFilters;
    }

    return suggestions;
  }, [displayMode, suggestions, initializedFilters]);

  const isInitializedMode =
    displayMode === 'initialized' || (suggestions.length === 0 && initializedFilters.length > 0);

  const heading = useMemo(() => {
    if (displayMode === 'ranked' && suggestions.length > 0) {
      return t('catalog.search.suggestedFilters.title');
    }

    if (activeItems.length > 0) {
      return t('catalog.search.suggestedFilters.startNarrowingTitle');
    }

    if (degraded) {
      return t('catalog.search.suggestedFilters.degradedTitle');
    }

    return t('catalog.search.suggestedFilters.unavailableTitle');
  }, [activeItems.length, degraded, displayMode, suggestions.length, t]);

  if (!isEnabled) {
    return null;
  }

  if (isLoading) {
    return (
      <section aria-labelledby="suggested-filters-heading" className="space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-diyar-brown" aria-hidden="true" />
          <h3 id="suggested-filters-heading" className="text-sm font-bold text-diyar-dark">
            {t('catalog.search.suggestedFilters.title')}
          </h3>
        </div>
        <SuggestionSkeleton />
      </section>
    );
  }

  if (isError) {
    return (
      <section
        aria-labelledby="suggested-filters-heading"
        className="rounded-xl border border-red-100 bg-red-50/70 p-4"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 shrink-0 text-red-500" size={18} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h3 id="suggested-filters-heading" className="text-sm font-bold text-red-800">
              {t('catalog.search.suggestedFilters.errorTitle')}
            </h3>
            <p className="mt-1 text-xs text-red-700/90">
              {t('catalog.search.suggestedFilters.errorDescription')}
            </p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                disabled={isRefetching}
                className="mt-3 cursor-pointer rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('catalog.search.suggestedFilters.retry')}
              </button>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  if (activeItems.length === 0) {
    return (
      <section
        aria-labelledby="suggested-filters-heading"
        className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-5 text-center"
      >
        <SlidersHorizontal className="mx-auto mb-2 text-gray-400" size={18} aria-hidden="true" />
        <h3 id="suggested-filters-heading" className="text-sm font-bold text-gray-700">
          {heading}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {degraded
            ? t('catalog.search.suggestedFilters.degradedDescription')
            : t('catalog.search.suggestedFilters.unavailableDescription')}
        </p>
      </section>
    );
  }

  const renderChip = (suggestion: FilterSuggestionItem, compactChip: boolean) => {
    const isRelax = suggestion.action === 'relax';
    const Icon = isRelax ? MinusCircle : isInitializedMode ? SlidersHorizontal : Target;

    const handleClick = () => {
      if (suggestion.apply?.mode === 'focus') {
        onFocusManual?.(suggestion.apply.focus_filter_key ?? suggestion.filter_key);
        return;
      }

      onSelect(suggestion);
    };

    if (compactChip || isInitializedMode) {
      return (
        <button
          key={`${suggestion.group}-${suggestion.priority}`}
          type="button"
          role="listitem"
          onClick={handleClick}
          className={`inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diyar-brown/40 ${
            isRelax
              ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
              : 'border-gray-200 bg-white text-diyar-dark hover:border-diyar-brown/40 hover:bg-diyar-brown/5'
          }`}
          aria-label={`${suggestion.label ?? suggestion.filter_key}. ${suggestion.reason ?? ''}`}
        >
          <Icon size={14} aria-hidden="true" />
          <span>{suggestion.label ?? suggestion.filter_key}</span>
        </button>
      );
    }

    return (
      <button
        key={`${suggestion.group}-${suggestion.priority}`}
        type="button"
        role="listitem"
        onClick={handleClick}
        className={`group cursor-pointer rounded-2xl border px-3 py-3 text-start transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-diyar-brown/40 ${
          isRelax
            ? 'border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-50'
            : 'border-gray-200 bg-white hover:border-diyar-brown/30 hover:bg-diyar-brown/5'
        }`}
        aria-label={`${suggestion.label ?? suggestion.filter_key}. ${suggestion.reason ?? ''}`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
              isRelax ? 'bg-amber-100 text-amber-700' : 'bg-diyar-brown/10 text-diyar-brown'
            }`}
          >
            <Icon size={15} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-diyar-dark">{suggestion.label}</span>
            {suggestion.reason ? (
              <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">
                {suggestion.reason}
              </span>
            ) : null}
            {suggestion.values && suggestion.values.length > 0 && !isRelax ? (
              <span className="mt-2 flex flex-wrap gap-1.5">
                {suggestion.values.slice(0, 3).map((value) => (
                  <span
                    key={value.value}
                    className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600"
                  >
                    {value.value}
                  </span>
                ))}
              </span>
            ) : null}
          </span>
        </div>
      </button>
    );
  };

  return (
    <section aria-labelledby="suggested-filters-heading" className="space-y-3 animate-in fade-in duration-300">
      {degraded ? (
        <p className="rounded-lg border border-amber-100 bg-amber-50/80 px-3 py-2 text-xs text-amber-800">
          {t('catalog.search.suggestedFilters.degradedDescription')}
        </p>
      ) : null}
      <div className="flex items-center gap-2">
        {isInitializedMode ? (
          <SlidersHorizontal size={16} className="text-diyar-brown" aria-hidden="true" />
        ) : (
          <Sparkles size={16} className="text-diyar-brown" aria-hidden="true" />
        )}
        <h3 id="suggested-filters-heading" className="text-sm font-bold text-diyar-dark">
          {heading}
        </h3>
      </div>

      <div
        className={
          isInitializedMode || compact
            ? 'flex flex-wrap gap-2'
            : 'grid grid-cols-1 gap-2 sm:grid-cols-2'
        }
        role="list"
      >
        {activeItems.map((suggestion) => renderChip(suggestion, compact || isInitializedMode))}
      </div>
    </section>
  );
}
