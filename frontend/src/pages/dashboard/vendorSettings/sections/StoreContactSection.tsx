import { RequiredLabel } from '../../../../components/dashboard/vendor/RequiredLabel.tsx';
import { FieldError } from '../../../../components/dashboard/vendor/FieldError.tsx';
import { SaudiPhoneInput } from '../../../../components/auth/SaudiPhoneInput.tsx';
import { INPUT_CLASS } from '../vendorSettings.types.ts';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type StoreContactSectionProps = Pick<
  VendorSettingsPageState,
  't' | 'storeForm' | 'patchStoreForm' | 'fieldErrors'
>;

export function StoreContactSection({
  t,
  storeForm,
  patchStoreForm,
  fieldErrors,
}: StoreContactSectionProps) {
  return (
    <div>
      <h3 className="font-bold text-diyar-dark mb-4">{t('vendor.settings.store.contactTitle')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <RequiredLabel required className="text-sm font-bold text-gray-700">
            {t('vendor.settings.store.supportPhone')}
          </RequiredLabel>
          <SaudiPhoneInput
            id="vendor-support-phone"
            value={storeForm.supportPhone}
            onChange={(value) => patchStoreForm({ supportPhone: value })}
          />
          <FieldError message={fieldErrors.support_phone} />
        </div>
        <div className="space-y-2">
          <RequiredLabel className="text-sm font-bold text-gray-700">
            {t('vendor.settings.store.supportEmail')}
          </RequiredLabel>
          <input
            type="email"
            value={storeForm.supportEmail}
            onChange={(event) => patchStoreForm({ supportEmail: event.target.value })}
            placeholder={t('vendor.settings.store.placeholders.supportEmail')}
            className={INPUT_CLASS}
            dir="ltr"
          />
          <FieldError message={fieldErrors.support_email} />
        </div>
      </div>
    </div>
  );
}
