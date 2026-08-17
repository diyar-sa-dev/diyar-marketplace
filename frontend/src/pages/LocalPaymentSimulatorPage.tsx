import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Loader2, ShieldCheck } from 'lucide-react';
import { ErrorState } from '../components/common/ErrorState.tsx';
import { useOrderPayment } from '../hooks/payment/usePayment.ts';
import { useLocale } from '../hooks/useLocale.ts';
import { useToast } from '../hooks/useToast.ts';
import { simulateOrderPayment } from '../api/payment.ts';
import { parseApiError } from '../utils/errors.ts';

type SimulateOutcome = 'success' | 'failed' | 'expired';

export default function LocalPaymentSimulatorPage() {
  const { orderId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attempt') ?? '';
  const { t, dir } = useLocale();
  const { toast } = useToast();
  const navigate = useNavigate();
  const paymentQuery = useOrderPayment(orderId, Boolean(orderId));
  const [pendingOutcome, setPendingOutcome] = useState<SimulateOutcome | null>(null);

  const handleSimulate = async (outcome: SimulateOutcome) => {
    if (!orderId || !attemptId) {
      toast.error(t('checkout.simulatorMissingAttempt'));
      return;
    }

    setPendingOutcome(outcome);

    try {
      const result = await simulateOrderPayment(orderId, attemptId, outcome);
      window.location.href = result.redirect_url;
    } catch (error) {
      const parsed = parseApiError(error);
      toast.error(parsed.message || t('checkout.simulatorError'));
      setPendingOutcome(null);
    }
  };

  if (!orderId || !attemptId) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
        <ErrorState message={t('checkout.simulatorMissingAttempt')} />
      </div>
    );
  }

  const amount = paymentQuery.data?.amount ?? '—';
  const currency = paymentQuery.data?.currency ?? t('common.currency');

  return (
    <div className="min-h-screen bg-gray-50 pt-20 pb-24" dir={dir}>
      <div className="max-w-lg mx-auto px-4">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-sm overflow-hidden">
          <div className="bg-linear-to-l from-amber-50 to-white px-6 py-5 border-b border-amber-100">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-diyar-dark text-white">
                <ShieldCheck size={22} />
              </span>
              <div>
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wide">{t('checkout.simulatorBadge')}</p>
                <h1 className="text-xl font-bold text-diyar-dark mt-1">{t('checkout.simulatorTitle')}</h1>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">{t('checkout.simulatorHint')}</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex items-center justify-between">
              <span className="text-sm text-gray-600">{t('checkout.total')}</span>
              <span className="text-lg font-bold text-diyar-dark tabular-nums">
                {amount} {currency}
              </span>
            </div>

            <p className="text-sm font-bold text-gray-700">{t('checkout.simulatorChooseOutcome')}</p>

            <div className="space-y-3">
              <button
                type="button"
                disabled={pendingOutcome !== null}
                onClick={() => void handleSimulate('success')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white py-3.5 font-bold hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
              >
                {pendingOutcome === 'success' ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                {t('checkout.simulatorSuccess')}
              </button>

              <button
                type="button"
                disabled={pendingOutcome !== null}
                onClick={() => void handleSimulate('failed')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-600 text-white py-3.5 font-bold hover:bg-red-700 transition disabled:opacity-50 cursor-pointer"
              >
                {pendingOutcome === 'failed' ? <Loader2 size={18} className="animate-spin" /> : <AlertTriangle size={18} />}
                {t('checkout.simulatorFailed')}
              </button>

              <button
                type="button"
                disabled={pendingOutcome !== null}
                onClick={() => void handleSimulate('expired')}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 text-white py-3.5 font-bold hover:bg-amber-700 transition disabled:opacity-50 cursor-pointer"
              >
                {pendingOutcome === 'expired' ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />}
                {t('checkout.simulatorExpired')}
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate(`/checkout/payment/${orderId}`)}
              className="w-full text-sm text-gray-500 hover:text-diyar-dark cursor-pointer py-2"
            >
              {t('checkout.simulatorBack')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
