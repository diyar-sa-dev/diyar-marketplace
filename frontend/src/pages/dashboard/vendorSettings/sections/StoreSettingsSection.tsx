import { Save } from 'lucide-react';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';
import { StoreContactSection } from './StoreContactSection.tsx';
import { StoreInfoSection } from './StoreInfoSection.tsx';
import { StoreLogoSection } from './StoreLogoSection.tsx';
import { WorkingHoursSection } from './WorkingHoursSection.tsx';

type StoreSettingsSectionProps = Pick<
  VendorSettingsPageState,
  | 't'
  | 'dir'
  | 'storeForm'
  | 'patchStoreForm'
  | 'fieldErrors'
  | 'logoInputRef'
  | 'logoPreview'
  | 'logoUrl'
  | 'deleteLogo'
  | 'isSavingStore'
  | 'updateHour'
  | 'handleLogoUpload'
  | 'handleLogoDelete'
  | 'handleSaveStore'
>;

export function StoreSettingsSection(props: StoreSettingsSectionProps) {
  const { t, isSavingStore, handleSaveStore } = props;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <StoreLogoSection {...props} />
      <StoreInfoSection
        t={props.t}
        storeForm={props.storeForm}
        patchStoreForm={props.patchStoreForm}
        fieldErrors={props.fieldErrors}
      />
      <hr className="border-gray-100" />
      <StoreContactSection
        t={props.t}
        storeForm={props.storeForm}
        patchStoreForm={props.patchStoreForm}
        fieldErrors={props.fieldErrors}
      />
      <WorkingHoursSection
        t={props.t}
        dir={props.dir}
        storeForm={props.storeForm}
        updateHour={props.updateHour}
        fieldErrors={props.fieldErrors}
      />
      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => void handleSaveStore()}
          disabled={isSavingStore}
          className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-[#A67B5B]/90 transition cursor-pointer disabled:opacity-60"
        >
          <Save size={18} />
          {isSavingStore ? t('vendor.settings.saving') : t('vendor.settings.store.save')}
        </button>
      </div>
    </div>
  );
}
