export type PaymentMethod = {
  code: string;
  available: boolean;
  label?: string | null;
};

export type PaymentSession = {
  session_id: string;
  country_code: string;
  test_mode: boolean;
  script_domain: string | null;
};

export type PaymentRecord = {
  id: string;
  status: string;
  amount: string;
  currency: string;
  gateway?: string | null;
  payment_reference?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
};

export type PaymentInitiation = {
  payment: PaymentRecord;
  session: PaymentSession;
  methods: PaymentMethod[];
  attempt_id: string;
  simulated?: boolean;
};

export type PaymentSubmission = {
  payment: PaymentRecord;
  payment_url: string;
  attempt_id: string;
};

export type PaymentCallbackInfo = {
  status: string;
  message: string;
  authoritative: boolean;
};
