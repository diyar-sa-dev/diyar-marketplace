export type AdminPayoutOwner = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
};

export type AdminVendorPayout = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  requested_at?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  vendor?: {
    id: string;
    business_name: string;
    slug: string;
    owner?: AdminPayoutOwner | null;
    bank_account?: {
      beneficiary_name: string;
      bank_code?: string | null;
      iban_last4?: string | null;
    } | null;
  } | null;
};

export type AdminAffiliatePayout = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  requested_at?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  payment_reference?: string | null;
  affiliate?: {
    id: string;
    display_name?: string | null;
    referral_code?: string | null;
    payout_account_holder?: string | null;
    payout_iban?: string | null;
    payout_bank_name?: string | null;
    owner?: AdminPayoutOwner | null;
  } | null;
};

export type AdminProviderPayout = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: string;
  requested_at?: string | null;
  processed_at?: string | null;
  rejection_reason?: string | null;
  provider?: {
    id: string;
    business_name: string;
    slug: string;
    owner?: AdminPayoutOwner | null;
    bank_account?: {
      beneficiary_name: string;
      bank_code?: string | null;
      iban_last4?: string | null;
    } | null;
  } | null;
};

export type AdminPayoutKind = 'vendor' | 'provider' | 'affiliate';

export type AdminPayoutRow = AdminVendorPayout | AdminProviderPayout | AdminAffiliatePayout;

export type PayoutAction = 'approve' | 'reject' | 'mark-paid' | 'mark-processing';
