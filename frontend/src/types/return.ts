export type ReturnReason =
  | 'manufacturing_defect'
  | 'damaged'
  | 'wrong_item'
  | 'not_as_described'
  | 'other';

export type ReturnRequestStatus =
  | 'requested'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'awaiting_return'
  | 'received'
  | 'inspected'
  | 'refunded'
  | 'cancelled';

export type ReturnItem = {
  id: string;
  order_item_id: string;
  quantity: number;
  unit_price: string;
  line_subtotal: string;
  product_name?: string;
};

export type RefundSummary = {
  id: string;
  reference: string;
  return_request_id: string;
  status: string;
  items_subtotal: string;
  vat_amount: string;
  shipping_amount: string;
  total_amount: string;
  currency: string;
  processed_at?: string | null;
};

export type ReturnEvidence = {
  id: string;
  original_name: string;
  mime_type: string;
  size_bytes: number;
  url?: string | null;
};

export type ReturnRequest = {
  id: string;
  reference: string;
  order_id: string;
  vendor_order_id: string;
  status: ReturnRequestStatus;
  reason: ReturnReason;
  customer_note?: string | null;
  vendor_note?: string | null;
  policy_snapshot: Record<string, unknown>;
  items?: ReturnItem[];
  evidence?: ReturnEvidence[];
  refund?: RefundSummary | null;
  order_number?: string;
  vendor_name?: string;
  submitted_at?: string;
  created_at?: string;
};

export type ReturnEligibility = {
  eligible: boolean;
  deadline?: string | null;
  remaining_quantity: number;
  accepted_reasons: ReturnReason[];
  policy: {
    returnable: boolean;
    return_window_days: number;
    accepted_reasons: ReturnReason[];
    requires_unused: boolean;
    requires_evidence: boolean;
    return_shipping_paid_by: string;
    shipping_refundable: boolean;
    source: string;
  };
};

export type VendorReturnPolicy = {
  returnable: boolean;
  return_window_days: number;
  accepted_reasons: ReturnReason[];
  requires_unused: boolean;
  requires_evidence: boolean;
  return_shipping_paid_by: string;
  shipping_refundable: boolean;
};

export type VendorReturnPolicyPayload = VendorReturnPolicy;

export type CreateReturnPayload = {
  vendor_order_id: string;
  reason: ReturnReason;
  customer_note?: string;
  evidence_provided?: boolean;
  items: Array<{ order_item_id: string; quantity: number }>;
};
