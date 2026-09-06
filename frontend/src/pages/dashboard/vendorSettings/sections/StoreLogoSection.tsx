import { Camera } from 'lucide-react';
import { FieldError } from '../../../../components/dashboard/vendor/FieldError.tsx';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type StoreLogoSectionProps = Pick<
  VendorSettingsPageState,
  | 't'
  | 'logoInputRef'
  | 'logoPreview'
  | 'logoUrl'
  | 'fieldErrors'
  | 'deleteLogo'
  | 'handleLogoUpload'
  | 'handleLogoDelete'
>;

export function StoreLogoSection({
  t,
  logoInputRef,
  logoPreview,
  logoUrl,
  fieldErrors,
  deleteLogo,
  handleLogoUpload,
  handleLogoDelete,
}: StoreLogoSectionProps) {
  return (
    <div>
      <h3 className="font-bold text-diyar-dark mb-4">{t('vendor.settings.store.logoTitle')}</h3>
      <div className="flex items-center gap-6">
        <button
          type="button"
          onClick={() => logoInputRef.current?.click()}
          className="w-24 h-24 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 relative overflow-hidden group cursor-pointer hover:border-diyar-brown/50 hover:bg-amber-50/20 transition-colors"
          aria-label={t('vendor.settings.store.changeLogo')}
        >
          <img src={logoPreview} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="text-white" size={24} />
          </div>
        </button>
        <input
          ref={logoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/svg+xml"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleLogoUpload(file);
            }
            event.target.value = '';
          }}
        />
        <div>
          <p className="text-sm text-gray-500 mb-2">{t('vendor.settings.store.logoFormats')}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              className="text-sm font-bold text-diyar-brown border border-diyar-brown px-4 py-2 rounded-xl hover:bg-amber-50 transition cursor-pointer"
            >
              {t('vendor.settings.store.changeLogo')}
            </button>
            {logoUrl && (
              <button
                type="button"
                onClick={() => void handleLogoDelete()}
                disabled={deleteLogo.isPending}
                className="text-sm font-bold text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition cursor-pointer disabled:opacity-60"
              >
                {t('vendor.settings.store.removeLogo')}
              </button>
            )}
          </div>
          <FieldError message={fieldErrors.logo} />
        </div>
      </div>
    </div>
  );
}
