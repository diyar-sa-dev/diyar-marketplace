import { Loader2, Save } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import type { TranslateFn } from '../../lib/i18n/types.ts';
import { fontOptionsForSetting } from '../utils/settingFontOptions.ts';
import {
  formatAdminPercentEffective,
  fromAdminPercentInput,
  getPercentSettingConfig,
  isPercentAdminSetting,
  toAdminPercentDisplay,
} from '../utils/settingPercentFormat.ts';
import { selectOptionsForSetting } from '../utils/settingSelectOptions.ts';

const inputClassName =
  'w-full rounded-xl border border-gray-200/90 bg-white px-3.5 py-2.5 text-sm text-diyar-dark shadow-sm outline-none transition focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/15 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400';

type SystemSetting = {
  group: string;
  key: string;
  full_key: string;
  type: string;
  effective_value: unknown;
  has_override: boolean;
};

type AdminSettingFieldCardProps = {
  setting: SystemSetting;
  label: string;
  hint?: string;
  disabled: boolean;
  isSaving: boolean;
  booleanOnLabel: string;
  booleanOffLabel: string;
  effectiveLabel: string;
  overriddenLabel: string;
  saveLabel: string;
  t: TranslateFn;
  onSave: (value: string) => void;
};

function SettingControl({
  setting,
  disabled,
  defaultValue,
  booleanOnLabel,
  booleanOffLabel,
  t,
}: {
  setting: SystemSetting;
  disabled: boolean;
  defaultValue: string;
  booleanOnLabel: string;
  booleanOffLabel: string;
  t: TranslateFn;
}) {
  const fontOptions = fontOptionsForSetting(setting.full_key);
  const selectOptions = selectOptionsForSetting(setting.full_key);

  if (selectOptions) {
    const hasCurrent = selectOptions.some((option) => option.value === defaultValue);

    return (
      <select
        name="value"
        defaultValue={hasCurrent ? defaultValue : selectOptions[0]?.value}
        disabled={disabled}
        className={inputClassName}
      >
        {selectOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {t(option.labelKey as never)}
          </option>
        ))}
      </select>
    );
  }

  if (fontOptions) {
    const hasCurrent = fontOptions.some((option) => option.value === defaultValue);

    return (
      <select
        name="value"
        defaultValue={hasCurrent ? defaultValue : fontOptions[0]?.value}
        disabled={disabled}
        className={inputClassName}
        style={{ fontFamily: defaultValue }}
      >
        {fontOptions.map((option) => (
          <option key={option.value} value={option.value} style={{ fontFamily: option.value }}>
            {t(option.labelKey as never)}
          </option>
        ))}
      </select>
    );
  }

  if (setting.type === 'boolean') {
    const isOn = defaultValue === 'true' || defaultValue === '1';

    return (
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
              isOn ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isOn ? booleanOnLabel : booleanOffLabel}
          </span>
        </div>
        <label className="relative inline-flex shrink-0 cursor-pointer items-center">
          <input type="hidden" name="value" value="false" />
          <input
            type="checkbox"
            name="value"
            value="true"
            defaultChecked={isOn}
            disabled={disabled}
            className="peer sr-only"
          />
          <span className="relative h-8 w-14 rounded-full bg-gray-300 transition-colors duration-200 peer-checked:bg-diyar-brown peer-focus-visible:ring-2 peer-focus-visible:ring-diyar-brown/30 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-checked:[&>span]:inset-s-7">
            <span className="absolute top-1 inset-s-1 h-6 w-6 rounded-full bg-white shadow transition-all duration-200" />
          </span>
        </label>
      </div>
    );
  }

  if (setting.type === 'color') {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-gray-200/90 bg-white p-2.5 shadow-sm">
        <input
          name="value"
          type="color"
          defaultValue={defaultValue.startsWith('#') ? defaultValue : '#947961'}
          disabled={disabled}
          className="h-11 w-14 cursor-pointer rounded-lg border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs text-gray-500" dir="ltr">
          {defaultValue}
        </span>
      </div>
    );
  }

  if (setting.type === 'integer' || setting.type === 'decimal') {
    const isLoyaltySetting = setting.full_key === 'commerce.loyalty_sar_per_point';
    const isPercentSetting = isPercentAdminSetting(setting.full_key);

    if (isPercentSetting) {
      const percentConfig = getPercentSettingConfig(setting.full_key);

      return (
        <div
          className="flex items-stretch overflow-hidden rounded-xl border border-gray-200/90 bg-white shadow-sm"
          dir="ltr"
        >
          <input
            name="value"
            type="number"
            inputMode="decimal"
            step={percentConfig?.step ?? 1}
            min={percentConfig?.min ?? 0}
            max={percentConfig?.max ?? 100}
            defaultValue={defaultValue}
            disabled={disabled}
            className="min-w-0 flex-1 border-0 bg-transparent px-3.5 py-2.5 text-sm text-diyar-dark outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
          />
          <span className="flex shrink-0 items-center border-s border-gray-200/90 bg-[#faf8f5] px-3 text-sm font-semibold text-gray-500">
            %
          </span>
        </div>
      );
    }

    return (
      <input
        name="value"
        type={isLoyaltySetting ? 'text' : 'number'}
        inputMode={isLoyaltySetting ? 'numeric' : undefined}
        pattern={isLoyaltySetting ? '[0-9]*' : undefined}
        step={setting.type === 'decimal' ? '0.01' : '1'}
        min={isLoyaltySetting ? 1 : undefined}
        defaultValue={defaultValue}
        disabled={disabled}
        onInput={
          isLoyaltySetting
            ? (event) => {
                event.currentTarget.value = event.currentTarget.value.replace(/\D/g, '');
              }
            : undefined
        }
        className={inputClassName}
      />
    );
  }

  return (
    <input
      name="value"
      type="text"
      defaultValue={defaultValue}
      disabled={disabled}
      className={inputClassName}
    />
  );
}

export function AdminSettingFieldCard({
  setting,
  label,
  hint,
  disabled,
  isSaving,
  booleanOnLabel,
  booleanOffLabel,
  effectiveLabel,
  overriddenLabel,
  saveLabel,
  t,
  onSave,
}: AdminSettingFieldCardProps) {
  const isBoolean = setting.type === 'boolean';
  const showEffective =
    !isBoolean &&
    setting.type !== 'color' &&
    fontOptionsForSetting(setting.full_key) === null &&
    selectOptionsForSetting(setting.full_key) === null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (disabled) return;
    const formData = new FormData(event.currentTarget);
    const raw = formData.get('value');
    const rawValue = raw instanceof File ? '' : String(raw ?? '');
    onSave(fromAdminPercentInput(setting.full_key, rawValue));
  };

  const footer: ReactNode = (
    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        {showEffective ? (
          <p className="text-xs text-gray-500 sm:truncate">
            <span className="font-medium text-gray-400">{effectiveLabel}:</span>{' '}
            <span className="font-mono text-gray-700" dir="ltr">
              {isPercentAdminSetting(setting.full_key)
                ? formatAdminPercentEffective(setting.full_key, setting.effective_value)
                : String(setting.effective_value)}
            </span>
          </p>
        ) : (
          <span className="text-xs text-transparent select-none">.</span>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled || isSaving}
        className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-diyar-dark px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-diyar-dark/90 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer sm:w-auto"
      >
        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
        {saveLabel}
      </button>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-white p-4 shadow-sm transition duration-200 hover:border-diyar-brown/20 hover:shadow-md sm:p-5 ${
        setting.has_override ? 'border-diyar-brown/25 ring-1 ring-diyar-brown/10' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-bold text-diyar-dark">{label}</h4>
            {setting.has_override ? (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                {overriddenLabel}
              </span>
            ) : null}
          </div>
          {hint ? (
            <p className="mt-1.5 text-xs leading-relaxed text-gray-500">{hint}</p>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-4 ${isBoolean ? '' : 'rounded-xl border border-gray-100/80 bg-[#faf8f5]/80 p-3.5'}`}
      >
        <SettingControl
          setting={setting}
          disabled={disabled}
          defaultValue={toAdminPercentDisplay(setting.full_key, setting.effective_value)}
          booleanOnLabel={booleanOnLabel}
          booleanOffLabel={booleanOffLabel}
          t={t}
        />
      </div>

      {footer}
    </form>
  );
}
