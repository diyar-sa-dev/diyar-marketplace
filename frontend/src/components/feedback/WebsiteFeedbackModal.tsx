import { useMemo, useState } from 'react';
import { Loader2, Star, X } from 'lucide-react';
import { isAxiosError } from 'axios';
import { useLocale } from '../../hooks/useLocale.ts';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { useToast } from '../../hooks/useToast.ts';
import { submitWebsiteFeedback } from '../../api/websiteFeedback.ts';
import {
  getOrCreateWebsiteFeedbackGuestKey,
  markWebsiteFeedbackSubmitted,
  type WebsiteFeedbackType,
} from '../../lib/websiteFeedbackStorage.ts';

const FEEDBACK_TYPES: WebsiteFeedbackType[] = ['general', 'search', 'checkout', 'design', 'bug'];

type WebsiteFeedbackModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmitted?: () => void;
};

export function WebsiteFeedbackModal({ open, onClose, onSubmitted }: WebsiteFeedbackModalProps) {
  const { t } = useLocale();
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [type, setType] = useState<WebsiteFeedbackType | null>(null);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayRating = hoverRating || rating;

  const typeOptions = useMemo(
    () =>
      FEEDBACK_TYPES.map((value) => ({
        value,
        label: t(`layout.feedback.types.${value}`),
      })),
    [t],
  );

  if (!open) {
    return null;
  }

  const validate = () => {
    const next: Record<string, string> = {};
    if (rating < 1) {
      next.rating = t('layout.feedback.ratingRequired');
    }
    if (!type) {
      next.type = t('layout.feedback.typeRequired');
    }
    const trimmed = message.trim();
    if (!trimmed) {
      next.message = t('layout.feedback.messageRequired');
    } else if (trimmed.length < 10) {
      next.message = t('layout.feedback.messageMin');
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        rating,
        type: type!,
        message: message.trim(),
        ...(user ? {} : { guest_key: getOrCreateWebsiteFeedbackGuestKey() }),
      };

      await submitWebsiteFeedback(payload);

      markWebsiteFeedbackSubmitted(
        {
          rating,
          type: type!,
          message: message.trim(),
          submittedAt: new Date().toISOString(),
        },
        user?.id,
      );

      setIsSuccess(true);
      onSubmitted?.();
      window.setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setRating(0);
        setType(null);
        setMessage('');
        setErrors({});
      }, 1400);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        toast.info(t('layout.feedback.alreadySubmitted'));
        onSubmitted?.();
        onClose();
        return;
      }
      toast.error(t('layout.feedback.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]">
      <div
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="website-feedback-title"
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100 bg-linear-to-r from-diyar-cream/20 to-white">
          <div>
            <h2 id="website-feedback-title" className="text-lg font-bold text-diyar-dark">
              {t('layout.feedback.title')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('layout.feedback.subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 cursor-pointer transition-colors"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {isSuccess ? (
          <div className="px-6 py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto mb-4">
              <Star size={28} fill="currentColor" />
            </div>
            <h3 className="text-xl font-bold text-diyar-dark">{t('layout.feedback.successTitle')}</h3>
            <p className="text-gray-500 mt-2">{t('layout.feedback.successBody')}</p>
          </div>
        ) : (
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-sm font-bold text-diyar-dark mb-2">{t('layout.feedback.ratingLabel')}</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1;
                  const active = value <= displayRating;
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHoverRating(value)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(value)}
                      className="p-1 cursor-pointer transition-transform hover:scale-110"
                      aria-label={`${value}`}
                    >
                      <Star
                        size={28}
                        className={active ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}
                      />
                    </button>
                  );
                })}
              </div>
              {errors.rating ? <p className="text-xs text-red-600 mt-1">{errors.rating}</p> : null}
            </div>

            <div>
              <p className="text-sm font-bold text-diyar-dark mb-2">{t('layout.feedback.typeLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setType(option.value)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                      type === option.value
                        ? 'bg-diyar-dark text-white border-diyar-dark'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-diyar-brown'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {errors.type ? <p className="text-xs text-red-600 mt-1">{errors.type}</p> : null}
            </div>

            <div>
              <label htmlFor="website-feedback-message" className="text-sm font-bold text-diyar-dark">
                {t('layout.feedback.messageLabel')}
              </label>
              <textarea
                id="website-feedback-message"
                rows={4}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t('layout.feedback.messagePlaceholder')}
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown resize-none"
              />
              {errors.message ? <p className="text-xs text-red-600 mt-1">{errors.message}</p> : null}
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
              className="w-full h-12 rounded-2xl bg-diyar-dark text-white font-bold hover:bg-black transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('layout.feedback.submitting')}
                </>
              ) : (
                t('layout.feedback.submit')
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
