import { Info, Pencil, Save, Wallet } from 'lucide-react';
import type { BusinessEntityType, SaudiBankCode } from '../../../../api/vendorSettings.ts';
import { RequiredLabel } from '../../../../components/dashboard/vendor/RequiredLabel.tsx';
import { FieldError } from '../../../../components/dashboard/vendor/FieldError.tsx';
import { digitsOnly } from '../../../../lib/vendorFormValidation.ts';
import { BANK_CODES, ENTITY_TYPES, INPUT_CLASS } from '../vendorSettings.types.ts';
import type { VendorSettingsPageState } from '../useVendorSettingsPage.ts';

type BusinessSettingsSectionProps = Pick<
  VendorSettingsPageState,
  | 't'
  | 'businessForm'
  | 'patchBusinessForm'
  | 'fieldErrors'
  | 'ibanMasked'
  | 'isSavingBusiness'
  | 'handleSaveBusiness'
>;

export function BusinessSettingsSection({
  t,
  businessForm,
  patchBusinessForm,
  fieldErrors,
  ibanMasked,
  isSavingBusiness,
  handleSaveBusiness,
}: BusinessSettingsSectionProps) {
  const { entityType, crNumber, taxNumber, bankCode, beneficiaryName, iban, ibanEditing } =
    businessForm;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4">
        <Info className="text-amber-600 mt-0.5 shrink-0" size={20} />
        <div className="text-sm text-amber-800 leading-relaxed">
          {t('vendor.settings.business.infoBanner')}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">
          {t('vendor.settings.business.legalTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2 md:col-span-2">
            <RequiredLabel required className="text-sm font-bold text-gray-700">
              {t('vendor.settings.business.entityType')}
            </RequiredLabel>
            <select
              value={entityType}
              onChange={(event) =>
                patchBusinessForm({ entityType: event.target.value as BusinessEntityType })
              }
              className={`${INPUT_CLASS} appearance-none`}
            >
              {ENTITY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`vendor.settings.entityTypes.${type}`)}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.entity_type} />
          </div>
          <div className="space-y-2">
            <RequiredLabel required className="text-sm font-bold text-gray-700">
              {t('vendor.settings.business.crNumber')}
            </RequiredLabel>
            <input
              type="text"
              inputMode="numeric"
              value={crNumber}
              onChange={(event) =>
                patchBusinessForm({ crNumber: digitsOnly(event.target.value).slice(0, 10) })
              }
              placeholder={t('vendor.settings.business.placeholders.crNumber')}
              className={`${INPUT_CLASS} dir-ltr text-left`}
              dir="ltr"
            />
            <FieldError message={fieldErrors.commercial_registration_number} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1 text-start">
              {t('vendor.settings.business.taxNumber')}{' '}
              <span className="text-gray-400 font-normal">
                {t('vendor.settings.business.taxOptional')}
              </span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={taxNumber}
              onChange={(event) =>
                patchBusinessForm({ taxNumber: digitsOnly(event.target.value).slice(0, 15) })
              }
              placeholder={t('vendor.settings.business.placeholders.taxNumber')}
              className={`${INPUT_CLASS} dir-ltr text-left`}
              dir="ltr"
            />
            <FieldError message={fieldErrors.tax_number} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-diyar-dark border-b border-gray-100 pb-2">
          {t('vendor.settings.business.bankTitle')}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2">
            <RequiredLabel required className="text-sm font-bold text-gray-700">
              {t('vendor.settings.business.bankName')}
            </RequiredLabel>
            <select
              value={bankCode}
              onChange={(event) =>
                patchBusinessForm({ bankCode: event.target.value as SaudiBankCode })
              }
              className={`${INPUT_CLASS} appearance-none`}
            >
              {BANK_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`vendor.settings.banks.${code}`)}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.bank_code} />
          </div>
          <div className="space-y-2">
            <RequiredLabel required className="text-sm font-bold text-gray-700">
              {t('vendor.settings.business.beneficiaryName')}
            </RequiredLabel>
            <input
              type="text"
              value={beneficiaryName}
              onChange={(event) => patchBusinessForm({ beneficiaryName: event.target.value })}
              placeholder={t('vendor.settings.business.placeholders.beneficiaryName')}
              className={INPUT_CLASS}
            />
            <FieldError message={fieldErrors.beneficiary_name} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <RequiredLabel required className="text-sm font-bold text-gray-700">
              {t('vendor.settings.business.iban')}
            </RequiredLabel>
            {!ibanEditing && ibanMasked && !iban ? (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 p-3.5">
                <Wallet size={18} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 mb-1">
                    {t('vendor.settings.business.ibanCurrent')}
                  </p>
                  <p className="font-mono text-sm text-diyar-dark tracking-wide" dir="ltr">
                    {ibanMasked}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => patchBusinessForm({ ibanEditing: true })}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white p-2 text-diyar-brown hover:bg-amber-50 cursor-pointer transition"
                  aria-label={t('vendor.settings.business.ibanEdit')}
                >
                  <Pencil size={16} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Wallet
                  size={18}
                  className="pointer-events-none absolute top-1/2 -translate-y-1/2 inset-s-3.5 text-gray-400"
                />
                <input
                  type="text"
                  value={iban}
                  onChange={(event) =>
                    patchBusinessForm({
                      iban: event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 24),
                    })
                  }
                  placeholder={t('vendor.settings.business.ibanPlaceholder')}
                  className={`${INPUT_CLASS} ps-10 pe-10 text-left font-mono tracking-wide`}
                  dir="ltr"
                  maxLength={24}
                  inputMode="text"
                  autoComplete="off"
                />
                {ibanMasked && (
                  <button
                    type="button"
                    onClick={() => patchBusinessForm({ ibanEditing: false, iban: '' })}
                    className="absolute top-1/2 -translate-y-1/2 inset-e-3 text-xs font-bold text-gray-500 hover:text-diyar-brown cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                )}
              </div>
            )}
            <p className="text-xs text-gray-500">{t('vendor.settings.business.ibanFormatHint')}</p>
            <FieldError message={fieldErrors.iban} />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="button"
          onClick={() => void handleSaveBusiness()}
          disabled={isSavingBusiness}
          className="bg-diyar-brown text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#A67B5B]/90 transition shadow-sm cursor-pointer disabled:opacity-60"
        >
          <Save size={18} />
          {isSavingBusiness ? t('vendor.settings.saving') : t('vendor.settings.business.save')}
        </button>
      </div>
    </div>
  );
}
