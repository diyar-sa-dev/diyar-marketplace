import { Link, useLocation } from 'react-router-dom';
import { LogIn, X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import { vendorButtonClass } from '../../lib/vendorProductValidation.ts';

interface AuthPromptModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  testId?: string;
}

export function AuthPromptModal({ open, onClose, title, message, testId = 'auth-prompt-modal' }: AuthPromptModalProps) {
  const { t, dir } = useLocale();
  const location = useLocation();

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-300 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      dir={dir}
      data-testid={testId}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative text-right">
        <button
          type="button"
          onClick={onClose}
          className={`${vendorButtonClass} absolute top-4 left-4 text-gray-400 hover:text-diyar-dark p-2`}
        >
          <X size={18} />
        </button>
        <div className="w-12 h-12 rounded-full bg-amber-50 text-diyar-brown flex items-center justify-center mb-4">
          <LogIn size={22} />
        </div>
        <h3 className="text-lg font-bold text-diyar-dark mb-2">
          {title ?? t('catalog.productDetail.authRequiredTitle')}
        </h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          {message ?? t('catalog.productDetail.authRequiredMessage')}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`${vendorButtonClass} px-4 py-2.5 text-sm text-gray-500 hover:bg-gray-50 rounded-xl`}
          >
            {t('catalog.productDetail.authCancel')}
          </button>
          <Link
            to="/auth"
            state={{ from: location.pathname }}
            data-testid="auth-prompt-login"
            className={`${vendorButtonClass} px-5 py-2.5 text-sm bg-diyar-brown text-white rounded-xl hover:bg-[#A67B5B]/90`}
          >
            {t('catalog.productDetail.authLogin')}
          </Link>
        </div>
      </div>
    </div>
  );
}
