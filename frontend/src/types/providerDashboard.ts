import type { ServiceBookingStatus } from './serviceRequests.ts';
import type { VendorWorkingHour } from '../api/vendorSettings.ts';

export type ProviderInboxFilters = {
  status?: 'all' | 'open' | 'submitted';
  page?: number;
  per_page?: number;
  q?: string;
  category?: string;
  sort?: 'newest' | 'oldest' | 'budget_asc' | 'budget_desc';
};

export type ProviderBooking = {
  id: string;
  reference: string;
  booking_source?: 'rfq' | 'direct';
  service_request_id?: string | null;
  status: ServiceBookingStatus;
  payment_status: string;
  price: string;
  currency: string;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  requested_scheduled_date?: string | null;
  requested_scheduled_time?: string | null;
  proposed_scheduled_date?: string | null;
  proposed_scheduled_time?: string | null;
  last_proposed_scheduled_date?: string | null;
  last_proposed_scheduled_time?: string | null;
  schedule_proposed_at?: string | null;
  location?: string | null;
  customer_notes?: string | null;
  provider_notes?: string | null;
  can_confirm?: boolean;
  can_propose_schedule?: boolean;
  customer?: { name: string; phone?: string | null; email?: string | null };
  service_title?: string | null;
  service?: {
    id: string;
    title: string;
    slug: string;
    description?: string | null;
    duration_label?: string | null;
    service_type_label?: string | null;
    pricing_label?: string | null;
    image_url?: string | null;
    category?: { slug: string; name: string } | null;
  } | null;
  service_request?: {
    id: string;
    reference?: string | null;
    title: string;
    description?: string | null;
    location?: string | null;
    budget_min?: number | null;
    budget_max?: number | null;
  } | null;
  service_offer?: {
    proposed_scheduled_date?: string | null;
    proposed_scheduled_time?: string | null;
    proposed_price?: string;
    currency?: string;
  } | null;
  created_at?: string;
  completed_at?: string | null;
};

export type ProviderFinanceSummary = {
  currency: string;
  available_balance: number;
  monthly_gross_earnings: number;
  monthly_commission: number;
  monthly_net_earnings: number;
  commission_rate: number;
  commission_percent: number;
  payout_minimum: number;
  payout_schedule: { min_days: number; max_days: number };
};

export type ProviderFinanceAnalyticsPoint = {
  name?: string;
  date?: string;
  label?: string;
  net: number;
};

export type ProviderFinanceTransaction = {
  id: string;
  transaction_type: string;
  amount: string;
  currency: string;
  direction: 'credit' | 'debit';
  description: string;
  booking_reference?: string | null;
  created_at?: string;
  status: 'completed' | 'scheduled' | 'cancelled';
};

export type ProviderBankAccount = {
  id: string;
  bank_code: string;
  bank_label: string;
  beneficiary_name: string;
  iban_masked?: string | null;
  iban_last4?: string | null;
  is_active: boolean;
  display_label: string;
};

export type ProviderSettings = {
  profile: {
    avatar_url?: string | null;
    specialty?: string | null;
    bio?: string | null;
    work_areas?: string | null;
  };
  working_hours: VendorWorkingHour[];
  account: {
    name: string;
    email?: string | null;
    phone?: string | null;
  };
  notifications: {
    new_bookings: boolean;
    appointment_reminders: boolean;
    messages: boolean;
    new_reviews: boolean;
  };
  bank_accounts: ProviderBankAccount[];
  payout_schedule: { min_days: number; max_days: number };
};

export type ProviderServiceFormPayload = {
  title: string;
  starting_price: number;
  service_category_id?: string;
  duration_label?: string;
  service_type_label?: string;
  location?: string;
  description?: string;
  is_active?: boolean;
  cover?: File;
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
