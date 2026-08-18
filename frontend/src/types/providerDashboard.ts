import type { ServiceBookingStatus } from './serviceRequests.ts';

export type ProviderInboxFilters = {
  status?: 'all' | 'open' | 'submitted';
  page?: number;
  per_page?: number;
  q?: string;
};

export type ProviderBooking = {
  id: string;
  reference: string;
  service_request_id: string;
  status: ServiceBookingStatus;
  payment_status: string;
  price: string;
  currency: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  location?: string | null;
  customer_notes?: string | null;
  customer?: { name: string };
  service_title?: string | null;
  service_request?: {
    id: string;
    title: string;
    description?: string;
  } | null;
  created_at?: string;
};

export type ProviderInboxItem = {
  id: string;
  reference: string;
  title: string;
  description: string;
  budget_min?: string | null;
  budget_max?: string | null;
  location?: string | null;
  customer?: { name: string };
  categories?: Array<{ id: string; name_ar: string; name_en: string; slug: string }>;
  attachments_count?: number;
  provider_has_offer?: boolean;
  created_at?: string;
};
