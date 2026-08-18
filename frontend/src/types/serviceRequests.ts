import type { ServiceCategory } from './services.ts';
import type { ApiSuccessResponse } from './api.ts';

export type ServiceRequestStatus =
  'pending' | 'offers_received' | 'offer_accepted' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceOfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';

export type ServiceBookingStatus =
  'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export type ServiceRequestAttachment = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url?: string | null;
};

export type ServiceOffer = {
  id: string;
  service_request_id: string;
  proposed_price: string;
  currency: string;
  duration_days?: number | null;
  message?: string | null;
  status: ServiceOfferStatus;
  expires_at?: string | null;
  quotation?: { original_name?: string; url?: string | null } | null;
  provider?: {
    id: string;
    name: string;
    slug: string;
    rating_average?: number;
    reviews_count?: number;
  };
  booking?: ServiceBooking | null;
  created_at?: string;
};

export type ServiceBookingPayment = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  gateway: string;
  payment_method?: string | null;
  payment_reference?: string | null;
  paid_at?: string | null;
};

export type ServiceBooking = {
  id: string;
  reference: string;
  service_request_id: string;
  service_offer_id: string;
  status: ServiceBookingStatus;
  payment_status: string;
  payment_strategy: string;
  price: string;
  currency: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  location?: string | null;
  customer_notes?: string | null;
  provider?: { id: string; name: string; slug: string };
  payment?: ServiceBookingPayment | null;
  completed_at?: string | null;
  created_at?: string;
};

export type ServiceRequestCard = {
  id: string;
  reference: string;
  title: string;
  description: string;
  status: ServiceRequestStatus;
  budget_min?: string | null;
  budget_max?: string | null;
  location?: string | null;
  offers_count: number;
  customer?: { name: string };
  attachments_count?: number;
  provider_has_offer?: boolean;
  categories?: ServiceCategory[];
  accepted_provider?: { id: string; name: string; slug: string } | null;
  accepted_price?: string | null;
  accepted_currency?: string | null;
  created_at?: string;
};

export type ServiceRequestDetail = ServiceRequestCard & {
  reference_links: string[];
  attachments?: ServiceRequestAttachment[];
  offers?: ServiceOffer[];
  accepted_offer?: ServiceOffer | null;
  booking?: ServiceBooking | null;
  service?: { id: string; title: string; slug: string } | null;
  updated_at?: string;
};

export type CreateServiceRequestPayload = {
  title?: string;
  description: string;
  category_ids: string[];
  service_id?: string;
  provider_account_id?: string;
  budget_min?: number;
  budget_max?: number;
  location?: string;
  reference_links?: string[];
};

export type PaginatedServiceRequests = {
  items: ServiceRequestCard[];
  pagination: { current_page: number; last_page: number; per_page: number; total: number };
};

export type ServiceRequestsResponse = ApiSuccessResponse<{
  items: ServiceRequestCard[];
  pagination: PaginatedServiceRequests['pagination'];
}>;
export type ServiceRequestResponse = ApiSuccessResponse<{ service_request: ServiceRequestDetail }>;
export type ServiceOfferResponse = ApiSuccessResponse<{ offer: ServiceOffer }>;
