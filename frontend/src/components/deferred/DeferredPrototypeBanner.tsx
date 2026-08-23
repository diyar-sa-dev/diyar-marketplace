import { Info } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

interface DeferredPrototypeBannerProps {
  scopeId: 'b2bDirectory' | 'blogCms' | 'sidebarProjects';
}

export function DeferredPrototypeBanner({ scopeId }: DeferredPrototypeBannerProps) {
  const { locale } = useLocale();
  const isAr = locale === 'ar';

  const title = isAr ? 'محتوى تجريبي — ليس بيانات تشغيلية' : 'Prototype content — not live transactional data';
  const description = isAr
    ? 'هذا القسم يعرض بيانات ثابتة للتصميم فقط. سيتم ربطه بواجهة API عند اعتماد نطاق المنتج.'
    : 'This section uses static design data only. It will connect to an API when the product scope is approved.';

  return (
    <div
      role="status"
      data-deferred-scope={scopeId}
      className="mb-6 flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950"
    >
      <Info size={18} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-0.5 leading-relaxed opacity-90">{description}</p>
      </div>
    </div>
  );
}
