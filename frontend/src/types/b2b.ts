import type { ApiSuccessResponse } from './api.ts';
import type { PaginationMeta } from './catalog.ts';
import type { ProjectCard } from './project.ts';

export type B2bPublicationStatus = 'draft' | 'published' | 'archived';
export type B2bVerificationStatus = 'pending' | 'verified' | 'rejected';
export type B2bLeadBudgetRange =
  | 'unspecified'
  | 'under_10k'
  | '10k_50k'
  | '50k_200k'
  | 'over_200k';

export interface B2bCategory {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  published_companies_count?: number;
}

export interface B2bTag {
  id: string;
  slug: string;
  name: string;
}

export interface B2bCompanyPortfolioImage {
  id: string;
  url: string;
  sort_order: number;
}

export interface B2bCompanyCard {
  slug: string;
  name: string;
  description?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  location?: string | null;
  rating: number;
  reviews_count: number;
  verified: boolean;
  featured: boolean;
  category?: B2bCategory | null;
  tags?: B2bTag[];
  id?: string;
  custom_category?: string | null;
  publication_status?: B2bPublicationStatus;
  verification_status?: B2bVerificationStatus;
  published_at?: string | null;
}

export interface B2bCompanyService {
  id: string;
  name: string;
  description?: string | null;
}

export interface B2bCompanyTestimonial {
  id: string;
  author_name: string;
  author_role?: string | null;
  rating: number;
  content: string;
}

export interface B2bCompanyStats {
  years_experience?: number | null;
  team_size?: number | null;
  team_size_label?: string | null;
  completed_projects: number;
}

export interface B2bCompanyDetail extends B2bCompanyCard {
  about?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  business_hours?: string | null;
  stats: B2bCompanyStats;
  services?: B2bCompanyService[];
  portfolio_gallery?: B2bCompanyPortfolioImage[];
  testimonials?: B2bCompanyTestimonial[];
  portfolio?: ProjectCard[];
}

export interface B2bCompanyListFilters {
  page?: number;
  per_page?: number;
  category?: string;
  location?: string;
  q?: string;
  verified?: boolean;
  featured?: boolean;
  sort?: 'featured' | 'rating' | 'newest' | 'name';
}

export interface B2bDirectoryStats {
  verified_companies: number;
  published_companies: number;
}

export interface PaginatedB2bCompanies {
  items: B2bCompanyCard[];
  pagination: PaginationMeta;
  stats: B2bDirectoryStats;
}

export interface SubmitB2bLeadPayload {
  project_type: string;
  estimated_quantity?: string;
  details: string;
  budget_range?: B2bLeadBudgetRange;
}

export type B2bLeadStatus = 'new' | 'accepted' | 'rejected';

/** @deprecated Use B2bLeadStatus — kept for partner API imports */
export type PartnerB2bLeadStatus = B2bLeadStatus;

export interface B2bLeadRequester {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

export interface PartnerB2bLead {
  id: string;
  project_type: string;
  estimated_quantity?: string | null;
  details: string;
  budget_range: B2bLeadBudgetRange;
  status: B2bLeadStatus;
  created_at?: string | null;
  updated_at?: string | null;
  requester?: B2bLeadRequester | null;
}

export interface CustomerB2bLead extends Omit<PartnerB2bLead, 'requester'> {
  company?: B2bCompanyCard | null;
}

export interface PartnerB2bLeadSummary {
  total: number;
  new: number;
  accepted: number;
  rejected: number;
}

export interface PartnerB2bLeadListFilters {
  page?: number;
  per_page?: number;
  status?: B2bLeadStatus | 'all';
  q?: string;
}

export interface PaginatedPartnerB2bLeads {
  summary: PartnerB2bLeadSummary;
  items: PartnerB2bLead[];
  pagination: PaginationMeta;
}

export type PartnerB2bLeadListResponse = ApiSuccessResponse<PaginatedPartnerB2bLeads>;
export type PartnerB2bLeadDetailResponse = ApiSuccessResponse<{ lead: PartnerB2bLead }>;

export type B2bCompaniesResponse = ApiSuccessResponse<PaginatedB2bCompanies>;
export type B2bCompanyDetailResponse = ApiSuccessResponse<{
  company: B2bCompanyDetail;
  related: B2bCompanyCard[];
}>;
export type B2bCategoriesResponse = ApiSuccessResponse<{ categories: B2bCategory[] }>;
export type B2bLeadResponse = ApiSuccessResponse<{ lead: { id: string } }>;

export interface PaginatedCustomerB2bLeads {
  items: CustomerB2bLead[];
  pagination: PaginationMeta;
}

export type CustomerB2bLeadsResponse = ApiSuccessResponse<PaginatedCustomerB2bLeads>;
export type CustomerB2bLeadDetailResponse = ApiSuccessResponse<{ lead: CustomerB2bLead }>;

export type PartnerB2bPortal = 'vendor' | 'provider';

export interface PartnerB2bCompanyDetail extends B2bCompanyDetail {
  id: string;
  b2b_category_id?: string | null;
  custom_category?: string | null;
  address?: string | null;
  business_hours?: string | null;
  years_experience?: number | null;
  team_size?: number | null;
  completed_projects?: number;
  tag_ids?: string[];
}

export interface PartnerB2bCompanyPayload {
  name: string;
  b2b_category_id?: string | null;
  custom_category?: string | null;
  slug?: string | null;
  description?: string | null;
  about?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  business_hours?: string | null;
  years_experience?: number | null;
  team_size?: number | null;
  completed_projects?: number | null;
  tag_ids?: string[];
  tag_names?: string[];
  services?: Array<{ name: string; description?: string | null }>;
}

export type PartnerB2bCompanyResponse = ApiSuccessResponse<{ company: PartnerB2bCompanyDetail | null }>;
