import type { B2bCompanyListFilters, PartnerB2bLeadListFilters } from '../../types/b2b.ts';

function serializeFilters(
  filters: B2bCompanyListFilters = {},
): readonly (string | number | boolean)[] {
  return [
    filters.page ?? 1,
    filters.per_page ?? 12,
    filters.category ?? '',
    filters.location ?? '',
    filters.q ?? '',
    filters.verified ?? '',
    filters.featured ?? '',
    filters.sort ?? 'featured',
  ];
}

export const b2bKeys = {
  all: ['marketplace', 'b2b'] as const,
  companies: (filters: B2bCompanyListFilters = {}) =>
    [...b2bKeys.all, 'companies', ...serializeFilters(filters)] as const,
  company: (slug: string) => [...b2bKeys.all, 'company', slug] as const,
  categories: () => [...b2bKeys.all, 'categories'] as const,
  partnerCompany: (portal: 'vendor' | 'provider') =>
    [...b2bKeys.all, 'partner-company', portal] as const,
  partnerCategories: (portal: 'vendor' | 'provider') =>
    [...b2bKeys.all, 'partner-categories', portal] as const,
  partnerTags: (portal: 'vendor' | 'provider') => [...b2bKeys.all, 'partner-tags', portal] as const,
  partnerLeads: (portal: 'vendor' | 'provider', filters: PartnerB2bLeadListFilters = {}) =>
    [
      ...b2bKeys.all,
      'partner-leads',
      portal,
      filters.page ?? 1,
      filters.per_page ?? 10,
      filters.status ?? 'all',
      filters.q ?? '',
    ] as const,
  partnerLead: (portal: 'vendor' | 'provider', leadId: string) =>
    [...b2bKeys.all, 'partner-lead', portal, leadId] as const,
  partnerReviews: (portal: 'vendor' | 'provider') =>
    [...b2bKeys.all, 'partner-reviews', portal] as const,
  customerLeads: (page = 1, perPage = 10) =>
    [...b2bKeys.all, 'customer-leads', page, perPage] as const,
  customerLead: (leadId: string) => [...b2bKeys.all, 'customer-lead', leadId] as const,
};
