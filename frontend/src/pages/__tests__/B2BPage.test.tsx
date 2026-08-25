import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import B2BPage from '../B2BPage.tsx';

const mockUseB2bCompanies = vi.fn();
const mockUseB2bCategories = vi.fn();

vi.mock('../../hooks/b2b/useB2bCompanies.ts', () => ({
  useB2bCompanies: (...args: unknown[]) => mockUseB2bCompanies(...args),
}));

vi.mock('../../hooks/b2b/useB2bCategories.ts', () => ({
  useB2bCategories: (...args: unknown[]) => mockUseB2bCategories(...args),
}));

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <MemoryRouter initialEntries={['/b2b']}>
          <B2BPage />
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe('B2BPage', () => {
  beforeEach(() => {
    mockUseB2bCategories.mockReturnValue({
      data: [{ id: '1', slug: 'furniture-manufacturing', name: 'تصنيع أثاث', published_companies_count: 2 }],
    });

    mockUseB2bCompanies.mockReturnValue({
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
      data: {
        items: [
          {
            id: '1',
            slug: 'modernwood',
            name: 'Modern Wood',
            description: 'مصنع أثاث',
            location: 'الرياض',
            logo: null,
            cover_image: null,
            rating: 4.8,
            reviews_count: 10,
            verified: true,
            featured: true,
            category: { id: '1', slug: 'furniture-manufacturing', name: 'تصنيع أثاث' },
            tags: [{ id: '1', slug: 'wood', name: 'خشب' }],
          },
        ],
        pagination: { current_page: 1, last_page: 1, per_page: 12, total: 1 },
        stats: { verified_companies: 3, published_companies: 5 },
      },
    });
  });

  it('renders directory title and company cards from API data', () => {
    renderPage();

    expect(screen.getByTestId('b2b-page-title')).toHaveTextContent('بوابة الأعمال (B2B)');
    expect(screen.getByTestId('b2b-company-card-modernwood')).toBeInTheDocument();
    expect(screen.getByText('Modern Wood')).toBeInTheDocument();
  });

  it('shows loading skeletons while companies are pending', () => {
    mockUseB2bCompanies.mockReturnValue({
      isPending: true,
      isError: false,
      isFetching: true,
      error: null,
      refetch: vi.fn(),
      data: undefined,
    });

    const { container } = renderPage();

    expect(screen.getByTestId('b2b-page-title')).toBeInTheDocument();
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('shows empty state when no companies match filters', () => {
    mockUseB2bCompanies.mockReturnValue({
      isPending: false,
      isError: false,
      isFetching: false,
      error: null,
      refetch: vi.fn(),
      data: {
        items: [],
        pagination: { current_page: 1, last_page: 1, per_page: 12, total: 0 },
        stats: { verified_companies: 0, published_companies: 0 },
      },
    });

    renderPage();

    expect(screen.getByText('لم يتم العثور على شركات تطابق بحثك')).toBeInTheDocument();
  });
});
