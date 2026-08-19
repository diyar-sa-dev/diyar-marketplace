import type { ApiSuccessResponse } from './api.ts';
import type { ServiceBookingStatus } from './serviceRequests.ts';

export type ServicePricingMode =
  'fixed' | 'starting_from' | 'hourly' | 'per_sqm' | 'per_project' | 'custom_quote';

export type ServiceBookingMode = 'request' | 'direct';

export interface ServiceCategory {
  id: string;
  name_ar: string;
  name_en: string;
  slug: string;
  description?: string | null;
  icon_key?: string | null;
  image_url?: string | null;
  sort_order: number;
}

export interface ServiceProviderRef {
  id: string;
  display_name: string;
  slug: string;
  avatar_url?: string | null;
  verified?: boolean;
}

export interface ServiceCard {
  id: string;
  title: string;
  slug: string;
  image_url?: string | null;
  pricing_mode: ServicePricingMode;
  booking_mode?: ServiceBookingMode;
  starting_price?: number | null;
  currency: string;
  pricing_label?: string | null;
  delivery_type_label?: string | null;
  service_type_label?: string | null;
  duration_label?: string | null;
  duration_minutes?: number | null;
  rating_average: number;
  reviews_count: number;
  remote_available?: boolean;
  location?: string | null;
  is_active?: boolean;
  description?: string | null;
  category?: {
    id?: string;
    slug: string;
    name: string;
  };
  provider?: ServiceProviderRef;
  user_saved?: boolean;
}

export interface ServicePortfolioItem {
  id: string;
  title?: string | null;
  description?: string | null;
  media_url?: string | null;
  sort_order: number;
}

export interface ProviderWorkingHour {
  day: string;
  label?: string;
  is_closed: boolean;
  opens_at: string | null;
  closes_at: string | null;
  closes_next_day?: boolean;
}

export interface ProviderFollowSummary {
  followers_count: number;
  is_following: boolean;
}

export interface ProviderPublic {
  id: string;
  display_name: string;
  slug: string;
  bio?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  location?: string | null;
  remote_available: boolean;
  verified: boolean;
  badges: string[];
  working_hours: ProviderWorkingHour[];
  completed_projects_count: number;
  active_services_count?: number;
  rating_average: number;
  reviews_count: number;
  joined_at?: string | null;
  follow: ProviderFollowSummary;
  is_own_provider?: boolean;
  work_policy_summary?: string[];
}

export interface ServiceDetail extends ServiceCard {
  description?: string | null;
  features: string[];
  requests_count: number;
  provider?: ProviderPublic;
  portfolio?: ServicePortfolioItem[];
  user_active_booking?: ServiceUserActiveBooking | null;
}

export interface ServiceUserActiveBooking {
  id: string;
  reference: string;
  status: ServiceBookingStatus;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  price: string | number;
  currency: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface PaginatedServices {
  items: ServiceCard[];
  pagination: PaginationMeta;
}

export interface ServiceListFilters {
  category?: string;
  q?: string;
  location?: string;
  pricing_mode?: ServicePricingMode;
  min_price?: number | string;
  max_price?: number | string;
  min_rating?: number | string;
  remote?: boolean | string;
  provider?: string;
  sort?: 'latest' | 'most_requested' | 'price_asc' | 'price_desc' | 'rating';
  page?: number;
  per_page?: number;
}

export type ServiceCategoriesResponse = ApiSuccessResponse<{
  categories: ServiceCategory[];
}>;

export type ServicesResponse = ApiSuccessResponse<PaginatedServices>;

export type ServiceDetailResponse = ApiSuccessResponse<{
  service: ServiceDetail;
}>;

export type RelatedServicesResponse = ApiSuccessResponse<{
  items: ServiceCard[];
}>;

export type ProviderResponse = ApiSuccessResponse<{
  provider: ProviderPublic;
}>;

export type ProviderFollowResponse = ApiSuccessResponse<{
  follow: ProviderFollowSummary;
}>;
