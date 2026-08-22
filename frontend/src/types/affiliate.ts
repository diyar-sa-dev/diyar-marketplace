export type AffiliatePlatformConfig = {
  min_commission_percent: string;
  max_commission_percent: string;
  attribution_window_days: number;
  payout_minimum: string;
  currency: string;
};

export type AffiliateProfileStatus = 'active' | 'suspended' | 'pending';

export type AffiliatePayoutStatus =
  'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';

export type AffiliateSocialLinks = {
  twitter?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  website?: string | null;
};

export type AffiliateProfile = {
  id: string;
  referral_code: string;
  status: AffiliateProfileStatus;
  display_name: string | null;
  payout_account_holder: string | null;
  payout_iban: string | null;
  payout_iban_masked?: string | null;
  payout_bank_code: string | null;
  payout_bank_name: string | null;
  social_links: AffiliateSocialLinks;
};

export type AffiliateBalance = {
  currency: string;
  pending: string;
  available: string;
  total: string;
  paid_out: string;
  payout_minimum?: string;
};

export type AffiliateChartPoint = {
  period: string;
  clicks: number;
  conversions: number;
  commission: string;
};

export type AffiliateOverviewStats = {
  balance: AffiliateBalance;
  clicks: number;
  conversions: number;
  conversion_rate?: string;
  earnings: string;
  active_links: number;
  period?: { from: string; to: string };
  chart?: AffiliateChartPoint[];
  top_links?: AffiliateReportLinkRow[];
};

export type AffiliateProductSummary = {
  id: string;
  name: string;
  slug: string;
  sale_price: string;
  image_url?: string | null;
  vendor_account_id?: string | null;
  vendor?: {
    business_name: string;
    slug: string;
  } | null;
};

export type AffiliateProductSetting = {
  product_id: string;
  enabled: boolean;
  commission_min_percent: string;
  commission_max_percent: string;
  commission_rate_percent: string;
  expected_commission?: string;
  product?: AffiliateProductSummary;
};

export type AffiliateLink = {
  id: string;
  name: string;
  referral_code: string;
  commission_rate_percent: string;
  is_active: boolean;
  product_affiliate_enabled?: boolean;
  inactive_reason?: 'manual' | 'product_disabled' | null;
  campaign_name: string | null;
  source: string | null;
  click_count: number;
  conversion_count: number;
  total_earnings: string;
  product?: AffiliateProductSummary;
  public_url?: string;
};

export type AffiliatePayout = {
  id: string;
  reference: string;
  amount: string;
  currency: string;
  status: AffiliatePayoutStatus;
  requested_at: string | null;
  processed_at: string | null;
  rejection_reason: string | null;
};

export type AffiliateReportLinkRow = {
  link_id: string;
  name: string;
  referral_code: string;
  public_url?: string;
  source?: string | null;
  product: {
    id: string;
    name: string | null;
    slug: string | null;
    image_url?: string | null;
  };
  clicks: number;
  conversions: number;
  earnings: string;
  is_active: boolean;
};

export type AffiliateReportSummary = {
  clicks: number;
  conversions: number;
  conversion_rate: string;
  earnings: string;
  pending_commissions: string;
  available_commissions: string;
  paid_commissions: string;
  reversed_commissions: string;
};

export type AffiliateDailyReportRow = {
  date: string;
  clicks: number;
  conversions: number;
  earnings: string;
};

export type AffiliateAttribution = {
  affiliate_profile_id: string;
  affiliate_link_id: string;
  affiliate_click_id?: string | null;
  traffic_source?: string;
  product_id: string;
  commission_rate_percent: string;
  expires_at: string;
};

export type AffiliatePagination = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AffiliateProductsResponse = {
  products: AffiliateProductSetting[];
  pagination: AffiliatePagination;
};

export type AffiliateLinksResponse = {
  links: AffiliateLink[];
  pagination: AffiliatePagination;
};

export type AffiliatePayoutsResponse = {
  balance: AffiliateBalance;
  payouts: AffiliatePayout[];
  pagination: AffiliatePagination;
};

export type AffiliateReportSourceRow = {
  source: string;
  clicks: number;
  conversions: number;
  conversion_rate: string;
  earnings: string;
};

export type AffiliateReportsResponse = {
  summary?: AffiliateReportSummary;
  by_link: AffiliateReportLinkRow[];
  by_source?: AffiliateReportSourceRow[];
  daily: AffiliateDailyReportRow[];
  period?: { from: string; to: string; key?: string };
};

export type AffiliateReportPeriod = 'day' | 'week' | 'month' | '3m' | '6m' | '12m' | 'year';

export type AffiliateSettingsPayload = {
  display_name?: string | null;
  payout_account_holder?: string | null;
  payout_iban?: string | null;
  payout_bank_code?: string | null;
  payout_bank_name?: string | null;
  social_links?: AffiliateSocialLinks | null;
};

export type CreateAffiliateLinkPayload = {
  name: string;
  product_id: string;
  commission_rate_percent?: number;
  campaign_name?: string;
  source?: string;
};

export type VendorProductAffiliatePayload = {
  enabled?: boolean;
  commission_min_percent: number;
  commission_max_percent: number;
  commission_rate_percent?: number | null;
};
