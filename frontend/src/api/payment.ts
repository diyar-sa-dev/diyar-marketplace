import { apiClient } from './client.ts';
import { ensureCsrfCookie } from '../lib/csrf.ts';
import type { ApiSuccessResponse } from '../types/api.ts';
import type {
  PaymentCallbackInfo,
  PaymentInitiation,
  PaymentRecord,
  PaymentSubmission,
} from '../types/payment.ts';

export async function fetchOrderPayment(orderId: string): Promise<PaymentRecord> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaymentRecord>>(
    `/orders/${orderId}/payment`,
  );
  return data.data;
}

export async function initiateOrderPayment(
  orderId: string,
  idempotencyKey: string,
): Promise<PaymentInitiation> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<PaymentInitiation>>(
    `/orders/${orderId}/payment`,
    {
      idempotency_key: idempotencyKey,
    },
  );
  return data.data;
}

export async function submitOrderPayment(
  orderId: string,
  sessionId: string,
  idempotencyKey: string,
  paymentMethod?: string | null,
): Promise<PaymentSubmission> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<ApiSuccessResponse<PaymentSubmission>>(
    `/orders/${orderId}/payment/submit`,
    {
      session_id: sessionId,
      idempotency_key: idempotencyKey,
      payment_method: paymentMethod ?? undefined,
    },
  );
  return data.data;
}

export async function fetchPaymentCallback(
  orderId: string,
  paymentId?: string,
): Promise<PaymentCallbackInfo> {
  const { data } = await apiClient.get<ApiSuccessResponse<PaymentCallbackInfo>>(
    `/orders/${orderId}/payment/callback`,
    { params: paymentId ? { paymentId } : undefined },
  );
  return data.data;
}

export async function simulateOrderPayment(
  orderId: string,
  attemptId: string,
  outcome: 'success' | 'failed' | 'expired',
): Promise<{ status: string; redirect_url: string }> {
  await ensureCsrfCookie();
  const { data } = await apiClient.post<
    ApiSuccessResponse<{ status: string; redirect_url: string }>
  >(`/orders/${orderId}/payment/simulate`, { attempt_id: attemptId, outcome });
  return data.data;
}
