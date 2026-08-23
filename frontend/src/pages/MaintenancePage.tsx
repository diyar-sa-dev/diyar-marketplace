import { Wrench } from 'lucide-react';
import { useLocale } from '../hooks/useLocale.ts';

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  const { t } = useLocale();

  return (
    <div className="min-h-screen bg-diyar-cream flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-3xl border border-gray-100 shadow-xl p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-diyar-cream text-diyar-brown">
          <Wrench size={28} />
        </div>
        <h1 className="text-2xl font-bold text-diyar-dark mb-3">{t('maintenance.title')}</h1>
        <p className="text-gray-600 leading-relaxed">
          {message || t('maintenance.description')}
        </p>
      </div>
    </div>
  );
}
