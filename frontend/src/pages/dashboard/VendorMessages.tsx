import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

export default function VendorMessages() {
  const { t } = useLocale();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-diyar-dark">{t('vendor.chat.title')}</h2>
        <p className="text-gray-500 text-sm mt-1">{t('vendor.chat.subtitle')}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center">
        <MessageSquare size={40} className="mx-auto text-diyar-brown/50 mb-4" />
        <h3 className="font-bold text-diyar-dark mb-2">{t('vendor.chat.emptyTitle')}</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          {t('vendor.chat.emptyDescription')}
        </p>
      </div>
    </div>
  );
}
