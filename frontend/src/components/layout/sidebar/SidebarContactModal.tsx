import { useState, type FormEvent } from 'react';
import { X, PhoneCall, MapPin, Phone, Send, CheckCircle, Mail } from 'lucide-react';
import { useAuth } from '../../../hooks/auth/useAuth.ts';
import { useLocale } from '../../../hooks/useLocale.ts';
import {
  getPlatformSupportEmail,
  getPlatformSupportMailHref,
  getPlatformSupportPhoneDisplay,
  getPlatformSupportTelHref,
} from '../../../lib/platformContact.ts';
import { validateConsultationForm } from '../../../lib/platformForms.ts';
import { saveConsultationRequest } from '../../../lib/consultationStorage.ts';
import { submitConsultation } from '../../../api/platform.ts';
import { parseApiError } from '../../../utils/errors.ts';
import { SaudiPhoneInput } from '../../auth/SaudiPhoneInput.tsx';

type SidebarContactModalProps = {
  onClose: () => void;
};

const inputClass =
  'w-full bg-gray-50 outline-none border border-gray-100 focus:border-diyar-brown focus:bg-white rounded-xl px-3.5 py-2.5 text-sm text-diyar-dark placeholder:text-gray-400 transition-colors';

export function SidebarContactModal({ onClose }: SidebarContactModalProps) {
  const { t, locale } = useLocale();
  const { user } = useAuth();
  const [contactForm, setContactForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactFieldErrors, setContactFieldErrors] = useState<Record<string, string>>({});

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError(null);

    const fieldErrors = validateConsultationForm(contactForm, t);
    setContactFieldErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      return;
    }

    setContactSubmitting(true);

    const payload = {
      name: contactForm.name.trim(),
      phone: contactForm.phone.trim(),
      email: contactForm.email.trim(),
      message: contactForm.message.trim(),
      locale,
    };

    try {
      await submitConsultation(payload);

      saveConsultationRequest(
        {
          ...payload,
          submittedAt: new Date().toISOString(),
        },
        user?.id,
      );

      setContactSuccess(true);
      setContactForm({ name: '', phone: '', email: '', message: '' });
      setContactFieldErrors({});
      setTimeout(() => {
        setContactSuccess(false);
      }, 4000);
    } catch (error) {
      setContactError(parseApiError(error, locale).message || t('layout.consultation.submitError'));
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-100 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-diyar-dark rounded-t-3xl sm:rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[94vh] sm:max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 end-4 bg-white hover:bg-gray-100 text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10 transition-colors border border-gray-200 cursor-pointer"
          title={t('layout.consultation.close')}
          aria-label={t('layout.consultation.close')}
        >
          <X size={18} />
        </button>

        <div className="flex-1 overflow-y-auto flex flex-col lg:flex-row">
          <div className="bg-linear-to-br from-[#132624] to-[#1a3330] text-white p-6 sm:p-8 lg:w-[38%] shrink-0">
            <PhoneCall className="w-10 h-10 text-diyar-brown mb-4" />
            <h4 className="text-xl font-bold mb-2 text-diyar-cream leading-snug">
              {t('layout.consultation.title')}
            </h4>
            <p className="text-sm text-diyar-cream/80 leading-relaxed mb-8">
              {t('layout.consultation.subtitle')}
            </p>

            <div className="space-y-5">
              <div className="flex items-start gap-3 text-sm">
                <MapPin size={18} className="text-diyar-brown shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">{t('layout.consultation.headquarters')}</p>
                  <p className="text-white/70 leading-relaxed">
                    {t('layout.consultation.headquartersAddress')}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Phone size={18} className="text-diyar-brown shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">{t('layout.contactBar.phoneLabel')}</p>
                  <a
                    href={getPlatformSupportTelHref()}
                    className="text-white/70 hover:text-diyar-brown transition-colors cursor-pointer"
                    dir="ltr"
                  >
                    {getPlatformSupportPhoneDisplay()}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Mail size={18} className="text-diyar-brown shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold mb-0.5">{t('layout.contactBar.emailLabel')}</p>
                  <a
                    href={getPlatformSupportMailHref()}
                    className="text-white/70 hover:text-diyar-brown transition-colors cursor-pointer break-all"
                  >
                    {getPlatformSupportEmail()}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 flex-1 bg-white min-w-0">
            <h4 className="font-bold text-lg text-diyar-dark mb-5 pe-10">
              {t('layout.consultation.formTitle')}
            </h4>

            {contactSuccess ? (
              <div className="min-h-75 flex flex-col items-center justify-center text-center py-10 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} />
                </div>
                <h5 className="font-bold text-base text-diyar-dark mb-2">
                  {t('layout.consultation.successTitle')}
                </h5>
                <p className="text-sm text-gray-500 max-w-xs">{t('layout.consultation.successBody')}</p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleContactSubmit(e)} className="space-y-4">
                {contactError && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                    {contactError}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    {t('layout.consultation.fullName')}
                  </label>
                  <input
                    type="text"
                    className={`${inputClass} ${contactFieldErrors.name ? 'border-red-300' : ''}`}
                    placeholder={t('layout.consultation.fullNamePlaceholder')}
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                  {contactFieldErrors.name && (
                    <p className="text-xs text-red-600 mt-1">{contactFieldErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      {t('layout.consultation.phone')}
                    </label>
                    <SaudiPhoneInput
                      value={contactForm.phone}
                      onChange={(phone) => setContactForm({ ...contactForm, phone })}
                      size="compact"
                    />
                    {contactFieldErrors.phone && (
                      <p className="text-xs text-red-600 mt-1">{contactFieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                      {t('layout.consultation.email')}
                    </label>
                    <input
                      type="email"
                      className={`${inputClass} ${contactFieldErrors.email ? 'border-red-300' : ''}`}
                      placeholder={t('layout.consultation.emailPlaceholder')}
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                    {contactFieldErrors.email && (
                      <p className="text-xs text-red-600 mt-1">{contactFieldErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">
                    {t('layout.consultation.message')}
                  </label>
                  <textarea
                    className={`${inputClass} h-28 resize-none ${contactFieldErrors.message ? 'border-red-300' : ''}`}
                    placeholder={t('layout.consultation.messagePlaceholder')}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                  {contactFieldErrors.message && (
                    <p className="text-xs text-red-600 mt-1">{contactFieldErrors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full bg-[#132624] text-white hover:bg-black font-bold text-sm py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-black/5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {contactSubmitting
                    ? t('layout.consultation.submitting')
                    : t('layout.consultation.submit')}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
