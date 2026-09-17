import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SuggestedFiltersSection } from './SuggestedFiltersSection.tsx';
import type { FilterSuggestionItem } from '../../types/filterSuggestions.ts';

vi.mock('../../hooks/useLocale.ts', () => ({
  useLocale: () => ({
    t: (key: string) => {
      const labels: Record<string, string> = {
        'catalog.search.suggestedFilters.title': 'Suggested filters',
        'catalog.search.suggestedFilters.startNarrowingTitle': 'Start narrowing your results',
        'catalog.search.suggestedFilters.unavailableTitle': 'No suitable filters for this context',
        'catalog.search.suggestedFilters.unavailableDescription': 'Try another category or search.',
        'catalog.search.suggestedFilters.degradedTitle':
          'Smart suggestions are temporarily unavailable',
        'catalog.search.suggestedFilters.degradedDescription':
          'You can use all available filters.',
        'catalog.search.suggestedFilters.errorTitle': 'Unable to load suggestions',
        'catalog.search.suggestedFilters.errorDescription': 'Please try again.',
        'catalog.search.suggestedFilters.retry': 'Retry',
      };

      return labels[key] ?? key;
    },
    locale: 'en',
    dir: 'ltr',
  }),
}));

const rankedSuggestion: FilterSuggestionItem = {
  filter_key: 'colors',
  group: 'colors',
  presentation: 'multi_select',
  priority: 1,
  action: 'narrow',
  reason_code: 'popular_values',
  label: 'Color',
  reason: 'Popular in this category',
  query_parameters: ['colors'],
  source: 'ranked',
  apply: { mode: 'set', set: { colors: 'White' } },
};

const initializedSuggestion: FilterSuggestionItem = {
  filter_key: 'price_range',
  group: 'price_range',
  presentation: 'range',
  priority: 1,
  action: 'narrow',
  reason_code: 'start_narrowing',
  label: 'Price',
  reason: 'Start with a price range',
  query_parameters: ['min_price', 'max_price'],
  source: 'initialized',
  apply: { mode: 'focus', focus_filter_key: 'price_range' },
};

describe('SuggestedFiltersSection', () => {
  it('renders ranked suggestions heading', () => {
    render(
      <SuggestedFiltersSection
        suggestions={[rankedSuggestion]}
        initializedFilters={[]}
        displayMode="ranked"
        isLoading={false}
        isError={false}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Suggested filters' })).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /Color/i })).toBeInTheDocument();
  });

  it('renders initialized filters when ranked suggestions are empty', () => {
    render(
      <SuggestedFiltersSection
        suggestions={[]}
        initializedFilters={[initializedSuggestion]}
        displayMode="initialized"
        isLoading={false}
        isError={false}
        onSelect={vi.fn()}
        onFocusManual={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Start narrowing your results' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('listitem', { name: /Price/i })).toBeInTheDocument();
  });

  it('focuses manual filter for initialized chips', () => {
    const onFocusManual = vi.fn();

    render(
      <SuggestedFiltersSection
        suggestions={[]}
        initializedFilters={[initializedSuggestion]}
        displayMode="initialized"
        isLoading={false}
        isError={false}
        onSelect={vi.fn()}
        onFocusManual={onFocusManual}
      />,
    );

    fireEvent.click(screen.getByRole('listitem', { name: /Price/i }));
    expect(onFocusManual).toHaveBeenCalledWith('price_range');
  });

  it('renders nothing when suggestions query is disabled', () => {
    const { container } = render(
      <SuggestedFiltersSection
        suggestions={[]}
        initializedFilters={[]}
        displayMode="unavailable"
        isEnabled={false}
        isLoading={false}
        isError={false}
        onSelect={vi.fn()}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows degraded copy when dependency fallback is empty', () => {
    render(
      <SuggestedFiltersSection
        suggestions={[]}
        initializedFilters={[]}
        displayMode="unavailable"
        degraded
        isEnabled
        isLoading={false}
        isError={false}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Smart suggestions are temporarily unavailable' }),
    ).toBeInTheDocument();
  });

  it('shows unavailable state only when both lists are empty', () => {
    render(
      <SuggestedFiltersSection
        suggestions={[]}
        initializedFilters={[]}
        displayMode="unavailable"
        isLoading={false}
        isError={false}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'No suitable filters for this context' }),
    ).toBeInTheDocument();
  });
});
