import { X } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

const MAJLIS_STAT_COUNT = '2,400+';

type AboutModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function renderStatLine(statTemplate: string) {
  const parts = statTemplate.split('{{count}}');
  if (parts.length === 1) {
    return statTemplate;
  }

  return (
    <>
      {parts[0]}
      <span dir="ltr" className="tabular-nums inline-block">
        {MAJLIS_STAT_COUNT}
      </span>
      {parts[1]}
    </>
  );
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { t, dir } = useLocale();

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/80 z-100 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="about-modal-title"
    >
      <div
        dir={dir}
        className="bg-[#fdfbf7] text-diyar-dark rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl relative max-h-[85vh] flex flex-col border border-diyar-brown/10 text-start"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 bg-white hover:bg-gray-100 text-gray-500 hover:text-black p-2 rounded-full shadow-md z-10 transition-colors border border-gray-200 cursor-pointer"
          title={t('layout.aboutModal.close')}
          aria-label={t('layout.aboutModal.close')}
        >
          <X size={18} />
        </button>

        <div className="p-8 bg-[#132624] text-white shrink-0 text-center relative overflow-hidden">
          <div className="absolute -bottom-10 -start-10 w-44 h-44 bg-white/2 rounded-full" />
          <h3 id="about-modal-title" className="text-xl md:text-2xl font-bold mb-2 text-diyar-cream">
            {t('layout.aboutModal.headline')}
          </h3>
          <p className="text-xs text-diyar-brown font-bold leading-6">{t('layout.aboutModal.subtitle')}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 leading-relaxed text-sm scrollbar-hide">
          <div>
            <h4 className="text-[#132624] font-bold text-base mb-2 border-s-4 border-diyar-brown ps-3">
              {t('layout.aboutModal.storyTitle')}
            </h4>
            <p className="text-gray-600 font-normal text-xs md:text-sm">{t('layout.aboutModal.storyBody')}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="font-bold text-diyar-dark mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#132624]" />
                {t('layout.aboutModal.visionTitle')}
              </h5>
              <p className="text-xs text-gray-500 font-normal">{t('layout.aboutModal.visionBody')}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h5 className="font-bold text-diyar-dark mb-1.5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-diyar-brown" />
                {t('layout.aboutModal.qualityTitle')}
              </h5>
              <p className="text-xs text-gray-500 font-normal">{t('layout.aboutModal.qualityBody')}</p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5 text-center">
            <div className="inline-block bg-[#132624]/5 text-diyar-dark text-xs font-bold px-4 py-2 rounded-full">
              {renderStatLine(t('layout.aboutModal.stat'))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
