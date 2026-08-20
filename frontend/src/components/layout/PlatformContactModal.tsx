import { Mail, Phone, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  getPlatformSupportEmail,
  getPlatformSupportMailHref,
  getPlatformSupportPhoneDisplay,
  getPlatformSupportTelHref,
} from '../../lib/platformContact.ts';

type PlatformContactModalProps = {
  open: boolean;
  onClose: () => void;
};

export function PlatformContactModal({ open, onClose }: PlatformContactModalProps) {
  const { t } = useLocale();

  if (!open) {
    return null;
  }

  const phoneDisplay = getPlatformSupportPhoneDisplay();
  const email = getPlatformSupportEmail();

  return (
    <div className="fixed inset-0 z-120 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="platform-contact-title"
        className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
          <h2 id="platform-contact-title" className="font-bold text-diyar-dark text-base">
            {t('layout.sidebar.contact')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:text-diyar-dark hover:bg-gray-100 transition-colors cursor-pointer"
            aria-label={t('layout.contactBar.closeMenu')}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <a
            href={getPlatformSupportMailHref()}
            onClick={onClose}
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-diyar-brown/30 hover:bg-diyar-brown/5 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0">
              <Mail size={18} />
            </div>
            <div className="min-w-0 text-right flex-1">
              <p className="text-[11px] font-bold text-gray-400 mb-0.5">
                {t('layout.contactBar.emailLabel')}
              </p>
              <p className="text-sm font-bold text-diyar-dark truncate group-hover:text-diyar-brown transition-colors">
                {email}
              </p>
            </div>
          </a>

          <a
            href={getPlatformSupportTelHref()}
            onClick={onClose}
            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-diyar-brown/30 hover:bg-diyar-brown/5 transition-all cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-full bg-diyar-brown/10 text-diyar-brown flex items-center justify-center shrink-0">
              <Phone size={18} />
            </div>
            <div className="min-w-0 text-right flex-1">
              <p className="text-[11px] font-bold text-gray-400 mb-0.5">
                {t('layout.contactBar.phoneLabel')}
              </p>
              <p className="text-sm font-bold text-diyar-dark group-hover:text-diyar-brown transition-colors" dir="ltr">
                {phoneDisplay}
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
