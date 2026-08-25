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
  stats: B2bCompanyStats;
  services?: B2bCompanyService[];
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

export type B2bCompaniesResponse = ApiSuccessResponse<PaginatedB2bCompanies>;
export type B2bCompanyDetailResponse = ApiSuccessResponse<{
  company: B2bCompanyDetail;
  related: B2bCompanyCard[];
}>;
export type B2bCategoriesResponse = ApiSuccessResponse<{ categories: B2bCategory[] }>;
export type B2bLeadResponse = ApiSuccessResponse<{ lead: { id: string } }>;
