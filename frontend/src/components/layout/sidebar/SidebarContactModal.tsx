import { useState, type FormEvent } from 'react';
import { X, PhoneCall, MapPin, Phone, Send, CheckCircle } from 'lucide-react';
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
import { SaudiPhoneInput } from '../../auth/SaudiPhoneInput.tsx';

type SidebarContactModalProps = {
  onClose: () => void;
};

export function SidebarContactModal({ onClose }: SidebarContactModalProps) {
  const { t } = useLocale();
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

    try {
      saveConsultationRequest(
        {
          name: contactForm.name.trim(),
          phone: contactForm.phone.trim(),
          email: contactForm.email.trim(),
          message: contactForm.message.trim(),
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
    } catch {
      setContactError(t('layout.consultation.submitError'));
    } finally {
      setContactSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white text-diyar-dark rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white hover:bg-gray-100 text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10 transition-colors border border-gray-200 cursor-pointer"
          title={t('layout.consultation.close')}
          aria-label={t('layout.consultation.close')}
        >
          <X size={18} />
        </button>

        {/* Left/Right Visual layout for contact options */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row">
          <div className="bg-[#132624] text-white p-6 md:p-8 md:w-2/5 flex flex-col justify-between shrink-0">
            <div>
              <PhoneCall className="w-10 h-10 text-diyar-brown mb-4" />
              <h4 className="text-lg font-bold mb-2 text-diyar-cream">
                {t('layout.consultation.title')}
              </h4>
              <p className="text-xs text-diyar-cream opacity-80 leading-relaxed mb-6 font-normal">
                {t('layout.consultation.subtitle')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-2.5 text-xs">
                <MapPin size={16} className="text-diyar-brown shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('layout.consultation.headquarters')}</p>
                  <p className="opacity-70">{t('layout.consultation.headquartersAddress')}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Phone size={16} className="text-diyar-brown shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('layout.contactBar.phoneLabel')}</p>
                  <a
                    href={getPlatformSupportTelHref()}
                    className="opacity-70 hover:opacity-100 hover:text-diyar-brown transition-colors cursor-pointer"
                    dir="ltr"
                  >
                    {getPlatformSupportPhoneDisplay()}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-xs">
                <Send size={16} className="text-diyar-brown shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">{t('layout.contactBar.emailLabel')}</p>
                  <a
                    href={getPlatformSupportMailHref()}
                    className="opacity-70 hover:opacity-100 hover:text-diyar-brown transition-colors cursor-pointer"
                  >
                    {getPlatformSupportEmail()}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Forms main layout */}
          <div className="p-6 md:p-8 flex-1 bg-white">
            <h4 className="font-bold text-base text-diyar-dark mb-4 pr-1">
              {t('layout.consultation.formTitle')}
            </h4>

            {contactSuccess ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 animate-in zoom-in-95 duration-200">
                <div className="w-14 h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={28} />
                </div>
                <h5 className="font-bold text-sm text-diyar-dark mb-1">
                  {t('layout.consultation.successTitle')}
                </h5>
                <p className="text-xs text-gray-500 font-normal">
                  {t('layout.consultation.successBody')}
                </p>
              </div>
            ) : (
              <form onSubmit={(e) => void handleContactSubmit(e)} className="space-y-3.5">
                {contactError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                    {contactError}
                  </p>
                )}
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('layout.consultation.fullName')}
                  </label>
                  <input
                    type="text"
                    className={`w-full bg-gray-50 outline-none border focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark ${
                      contactFieldErrors.name ? 'border-red-300' : 'border-gray-100'
                    }`}
                    placeholder={t('layout.consultation.fullNamePlaceholder')}
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  />
                  {contactFieldErrors.name && (
                    <p className="text-[10px] text-red-600 mt-1">{contactFieldErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      {t('layout.consultation.phone')}
                    </label>
                    <SaudiPhoneInput
                      value={contactForm.phone}
                      onChange={(phone) => setContactForm({ ...contactForm, phone })}
                    />
                    {contactFieldErrors.phone && (
                      <p className="text-[10px] text-red-600 mt-1">{contactFieldErrors.phone}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">
                      {t('layout.consultation.email')}
                    </label>
                    <input
                      type="email"
                      className={`w-full bg-gray-50 outline-none border focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark ${
                        contactFieldErrors.email ? 'border-red-300' : 'border-gray-100'
                      }`}
                      placeholder={t('layout.consultation.emailPlaceholder')}
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    />
                    {contactFieldErrors.email && (
                      <p className="text-[10px] text-red-600 mt-1">{contactFieldErrors.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-500 mb-1">
                    {t('layout.consultation.message')}
                  </label>
                  <textarea
                    className={`w-full bg-gray-50 outline-none border focus:border-diyar-brown focus:bg-white rounded-xl px-3 py-2 text-xs text-diyar-dark h-24 resize-none ${
                      contactFieldErrors.message ? 'border-red-300' : 'border-gray-100'
                    }`}
                    placeholder={t('layout.consultation.messagePlaceholder')}
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  />
                  {contactFieldErrors.message && (
                    <p className="text-[10px] text-red-600 mt-1">{contactFieldErrors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={contactSubmitting}
                  className="w-full bg-[#132624] text-white hover:bg-black font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 mt-4 shadow-lg shadow-black/5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send size={14} />
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
