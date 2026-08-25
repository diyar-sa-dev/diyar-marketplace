import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocaleProvider } from '../../lib/i18n/LocaleProvider.tsx';
import B2BCompanyPage from '../B2BCompanyPage.tsx';

const mockUseB2bCompany = vi.fn();
const mockUseSubmitB2bLead = vi.fn();
const mockUseAuth = vi.fn();
const mockNavigate = vi.fn();
const mockToast = { warning: vi.fn(), error: vi.fn(), success: vi.fn() };

vi.mock('../../hooks/b2b/useB2bCompany.ts', () => ({
  useB2bCompany: (...args: unknown[]) => mockUseB2bCompany(...args),
}));

vi.mock('../../hooks/b2b/useSubmitB2bLead.ts', () => ({
  useSubmitB2bLead: (...args: unknown[]) => mockUseSubmitB2bLead(...args),
}));

vi.mock('../../hooks/auth/useAuth.ts', () => ({
  useAuth: (...args: unknown[]) => mockUseAuth(...args),
}));

vi.mock('../../hooks/useToast.ts', () => ({
  useToast: () => ({ toast: mockToast }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const companyFixture = {
  id: '1',
  slug: 'modernwood',
  name: 'Modern Wood',
  description: 'مصنع أثاث',
  about: '<p>نبذة عن الشركة</p>',
  location: 'الرياض',
  logo: null,
  cover_image: null,
  rating: 4.8,
  reviews_count: 12,
  verified: true,
  featured: true,
  category: { id: '1', slug: 'furniture-manufacturing', name: 'تصنيع أثاث' },
  phone: '+966501111111',
  email: 'info@modernwood.test',
  website: 'https://modernwood.test',
  portfolio: [],
  services: [{ id: '1', name: 'تصنيع مخصص', description: null }],
  testimonials: [],
  stats: { years_experience: 10, team_size: 50, completed_projects: 120, team_size_label: null },
};

function renderPage(slug = 'modernwood') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <MemoryRouter initialEntries={[`/b2b/${slug}`]}>
          <Routes>
            <Route path="/b2b/:id" element={<B2BCompanyPage />} />
          </Routes>
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe('B2BCompanyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true });
    mockUseB2bCompany.mockReturnValue({
      isPending: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
      data: { company: companyFixture },
    });
    mockUseSubmitB2bLead.mockReturnValue({
      isPending: false,
      mutateAsync: vi.fn().mockResolvedValue({ lead: { id: 'lead-1' } }),
    });
  });

  it('renders company profile from hook data', () => {
    renderPage();

    expect(screen.getByRole('heading', { level: 1, name: 'Modern Wood' })).toBeInTheDocument();
    expect(screen.getByTestId('b2b-rfq-open')).toBeInTheDocument();
  });

  it('redirects guest to login when opening RFQ', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false });
    renderPage();

    fireEvent.click(screen.getByTestId('b2b-rfq-open'));

    expect(mockToast.warning).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/b2b/modernwood' } });
  });

  it('submits RFQ when authenticated and shows success', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ lead: { id: 'lead-1' } });
    mockUseSubmitB2bLead.mockReturnValue({ isPending: false, mutateAsync });

    renderPage();

    fireEvent.click(screen.getByTestId('b2b-rfq-open'));
    fireEvent.change(screen.getByTestId('b2b-rfq-project-type'), {
      target: { value: 'تأثيث مكتب' },
    });
    fireEvent.change(screen.getByTestId('b2b-rfq-details'), {
      target: { value: 'نحتاج تأثيث مكتب كامل للاختبار الآلي.' },
    });
    await fireEvent.click(screen.getByTestId('b2b-rfq-submit'));

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        project_type: 'تأثيث مكتب',
        estimated_quantity: undefined,
        details: 'نحتاج تأثيث مكتب كامل للاختبار الآلي.',
        budget_range: 'unspecified',
      });
    });

    expect(await screen.findByTestId('b2b-rfq-success')).toBeInTheDocument();
  });
});
