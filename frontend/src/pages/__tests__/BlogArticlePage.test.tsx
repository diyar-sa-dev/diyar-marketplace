import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import BlogArticlePage from '../BlogArticlePage.tsx';

const mockUseBlogArticle = vi.fn();

vi.mock('../../hooks/blog/useBlogArticle.ts', () => ({
  useBlogArticle: (...args: unknown[]) => mockUseBlogArticle(...args),
}));

function renderPage(slug = 'sample-article') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <MemoryRouter initialEntries={[`/blog/${slug}`]}>
          <Routes>
            <Route path="/blog/:slug" element={<BlogArticlePage />} />
          </Routes>
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe('BlogArticlePage', () => {
  beforeEach(() => {
    mockUseBlogArticle.mockReturnValue({
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      data: {
        article: {
          id: '1',
          slug: 'sample-article',
          title: 'مقال تجريبي',
          excerpt: 'ملخص',
          content: '<p>محتوى المقال</p>',
          hero_image: 'https://example.com/cover.jpg',
          author_name: 'فريق ديار',
          author_avatar: null,
          author_role: 'خبراء التصميم',
          reading_time_minutes: 4,
          published_at: '2024-05-15T10:00:00.000Z',
          tags: [{ id: '1', slug: 'design', name: 'تصميم داخلي' }],
        },
        related: [],
      },
    });
  });

  it('renders article title and content from the hook', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'مقال تجريبي' })).toBeInTheDocument();
    expect(screen.getByText('محتوى المقال')).toBeInTheDocument();
    expect(screen.getByText('4 دقائق قراءة')).toBeInTheDocument();
  });
});
