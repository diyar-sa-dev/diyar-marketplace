import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ShieldCheck } from 'lucide-react';
import { LoadingState } from '../components/common/LoadingState.tsx';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { CheckoutPaymentMethods } from '../components/checkout/CheckoutPaymentMethods.tsx';
import { useInitiatePayment, useOrderPayment, useSubmitPayment } from '../hooks/payment/usePayment.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { parseApiError } from '../utils/errors.ts';
import {
  CHECKOUT_PAYMENT_METHODS,
  readStoredPaymentMethod,
  resolveApiCodeForPaymentMethod,
  type CheckoutPaymentMethodId,
} from '../lib/paymentMethods.ts';

function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

export default function OrderPaymentPage() {
  const { orderId = '' } = useParams();
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const currency = t('common.currency');

  const [idempotencyKey, setIdempotencyKey] = useState(() => newIdempotencyKey());
  const [selectedMethod, setSelectedMethod] = useState<CheckoutPaymentMethodId>(
    () => readStoredPaymentMethod() ?? 'mada',
  );

  const paymentQuery = useOrderPayment(orderId, Boolean(orderId));
  const initiate = useInitiatePayment(orderId);
  const submit = useSubmitPayment(orderId);

  useEffect(() => {
    if (!orderId || initiate.isSuccess || initiate.isPending || initiate.isError) {
      return;
    }

    void initiate.mutateAsync(idempotencyKey).catch((error) => {
      const parsed = parseApiError(error);
      toast.error(parsed.message || t('checkout.paymentInitFailed'));
    });
  }, [orderId, idempotencyKey, initiate.isSuccess, initiate.isPending, initiate.isError, initiate.mutateAsync, t, toast]);

  useEffect(() => {
    if (paymentQuery.data?.status === 'paid') {
      toast.success(t('checkout.paymentSuccess'));
      navigate(`/orders?highlight=${orderId}`, { replace: true });
    }
  }, [paymentQuery.data?.status, navigate, orderId, t, toast]);

  const apiMethods = initiate.data?.methods ?? [];
  const availableApiCodes = apiMethods.filter((method) => method.available).map((method) => method.code);
  const session = initiate.data?.session;
  const payment = paymentQuery.data ?? initiate.data?.payment;

  const payableAmount = useMemo(() => payment?.amount ?? '—', [payment?.amount]);

  const displayMethods = useMemo(() => {
    if (availableApiCodes.length === 0) {
      return CHECKOUT_PAYMENT_METHODS;
    }

    return CHECKOUT_PAYMENT_METHODS.filter((method) =>
      method.apiCodes.some((code) => availableApiCodes.map((entry) => entry.toLowerCase()).includes(code)),
    );
  }, [availableApiCodes]);

  useEffect(() => {
    if (displayMethods.length === 0) {
      return;
    }

    if (!displayMethods.some((method) => method.id === selectedMethod)) {
      setSelectedMethod(displayMethods[0].id);
    }
  }, [displayMethods, selectedMethod]);

  const selectedApiCode = resolveApiCodeForPaymentMethod(selectedMethod, availableApiCodes);

  const handleRetryInitiate = () => {
    setIdempotencyKey(newIdempotencyKey());
    initiate.reset();
  };

  const handlePay = async () => {
    if (!session?.session_id) {
      toast.error(t('checkout.paymentInitFailed'));
      return;
    }

    if (availableApiCodes.length > 0 && !selectedApiCode) {
      toast.error(t('checkout.paymentMethodUnavailable'));
      return;
    }

    try {
      const result = await submit.mutateAsync({
        sessionId: session.session_id,
        idempotencyKey,
        paymentMethod: selectedApiCode,
      });

      if (result.payment_url) {
        const target = new URL(result.payment_url, window.location.origin);
        target.searchParams.set('attempt', result.attempt_id);
        window.location.href = target.toString();
        return;
      }

      toast.error(t('checkout.paymentUrlMissing'));
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(parsed.message || t('checkout.paymentSubmitFailed'));
    }
  };

  if (!orderId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
        <ErrorState message={t('checkout.paymentOrderMissing')} />
      </div>
    );
  }

  if (initiate.isPending && !initiate.data) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
        <LoadingState message={t('checkout.paymentLoading')} />
      </div>
    );
  }

  if (initiate.isError) {
    const errorMessage = initiate.error
      ? parseApiError(initiate.error).message
      : t('checkout.paymentInitFailed');

    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
        <div className="max-w-xl mx-auto px-4 space-y-4">
          <ErrorState
            error={initiate.error ?? errorMessage}
            title={t('checkout.paymentSection')}
            onRetry={handleRetryInitiate}
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => navigate(`/orders?highlight=${orderId}`)}
              className="text-sm font-semibold text-diyar-brown hover:text-diyar-dark cursor-pointer"
            >
              {t('checkout.viewOrderLater')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-diyar-dark">{t('checkout.paymentSection')}</h1>
            <p className="text-sm text-gray-500 mt-2">{t('checkout.paymentSecureHint')}</p>
          </div>

          <div className="rounded-xl bg-amber-50/60 border border-amber-100 p-4 flex items-center justify-between">
            <span className="text-sm text-gray-600">{t('checkout.total')}</span>
            <span className="text-lg font-bold text-diyar-dark tabular-nums">
              {payableAmount} {currency}
            </span>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-bold text-gray-700">{t('checkout.choosePaymentMethod')}</p>
            {displayMethods.length > 0 ? (
              <CheckoutPaymentMethods selected={selectedMethod} onChange={setSelectedMethod} />
            ) : (
              <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                {t('checkout.paymentMethodsUnavailable')}
              </p>
            )}
          </div>

          {initiate.data?.simulated && (
            <p className="text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 leading-relaxed">
              {t('checkout.simulatedGatewayHint')}
            </p>
          )}

          <button
            type="button"
            disabled={displayMethods.length === 0 || !session?.session_id || submit.isPending}
            onClick={() => void handlePay()}
            className="w-full bg-diyar-dark text-white py-4 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 hover:bg-black transition"
          >
            {submit.isPending ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
            {submit.isPending ? t('checkout.paymentRedirecting') : t('checkout.payNow')}
          </button>

          <p className="text-xs text-gray-500 leading-relaxed">{t('checkout.paymentAuthoritativeNote')}</p>

          <button
            type="button"
            onClick={() => navigate(`/orders?highlight=${orderId}`)}
            className="text-sm text-gray-500 hover:text-diyar-dark cursor-pointer"
          >
            {t('checkout.viewOrderLater')}
          </button>
        </div>
      </div>
    </div>
  );
}
