import { Camera, Trash2 } from 'lucide-react';
import { FieldError } from '../../../../components/dashboard/vendor/FieldError.tsx';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type AppearanceSettingsSectionProps = Pick<
  VendorSettingsPageState,
  | 't'
  | 'coverInputRef'
  | 'coverPreview'
  | 'coverUrl'
  | 'fieldErrors'
  | 'deleteCover'
  | 'handleCoverUpload'
  | 'handleCoverDelete'
>;

export function AppearanceSettingsSection({
  t,
  coverInputRef,
  coverPreview,
  coverUrl,
  fieldErrors,
  deleteCover,
  handleCoverUpload,
  handleCoverDelete,
}: AppearanceSettingsSectionProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h3 className="font-bold text-diyar-dark mb-4">
          {t('vendor.settings.appearance.coverTitle')}
        </h3>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="w-full aspect-3/1 min-h-35 sm:min-h-45 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors"
          aria-label={t('vendor.settings.appearance.changeCover')}
        >
          <img src={coverPreview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col items-center text-white gap-2">
              <Camera size={32} />
              <span className="font-bold">{t('vendor.settings.appearance.changeCover')}</span>
            </div>
          </div>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleCoverUpload(file);
            }
            event.target.value = '';
          }}
        />
        <p className="text-sm text-gray-500 mt-2">{t('vendor.settings.appearance.coverHint')}</p>
        <p className="text-xs text-gray-400 mt-1">{t('vendor.settings.appearance.coverFormats')}</p>
        {coverUrl && (
          <button
            type="button"
            onClick={() => void handleCoverDelete()}
            disabled={deleteCover.isPending}
            className="mt-3 text-sm font-bold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition cursor-pointer disabled:opacity-60 inline-flex items-center gap-3"
          >
            <Trash2 size={16} />
            {t('vendor.settings.appearance.removeCover')}
          </button>
        )}
        <FieldError message={fieldErrors.cover} />
      </div>
    </div>
  );
}
