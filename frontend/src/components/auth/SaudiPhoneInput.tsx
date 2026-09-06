import {
  SAUDI_PHONE_DIGITS,
  sanitizeSaudiPhoneInput,
  toSaudiPhoneNationalInput,
} from '../../lib/auth/validation.ts';

type SaudiPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  id?: string;
  required?: boolean;
  size?: 'default' | 'compact';
};

export function SaudiPhoneInput({
  value,
  onChange,
  autoComplete = 'tel',
  id,
  required = true,
  size = 'default',
}: SaudiPhoneInputProps) {
  const nationalPhone = toSaudiPhoneNationalInput(value);
  const isCompact = size === 'compact';

  return (
    <div className="relative flex min-w-0" dir="ltr">
      <div
        className={`flex items-center justify-center shrink-0 rounded-s-xl border border-gray-100 border-e-0 bg-gray-50 font-bold text-gray-600 ${
          isCompact ? 'px-3 text-sm' : 'px-3 sm:px-4'
        }`}
      >
        +966
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="5[0-9]{8}"
        required={required}
        value={nationalPhone}
        onChange={(e) => onChange(sanitizeSaudiPhoneInput(e.target.value))}
        autoComplete={autoComplete}
        maxLength={SAUDI_PHONE_DIGITS}
        className={`min-w-0 flex-1 rounded-e-xl border border-gray-100 bg-gray-50 outline-none transition-colors focus:border-diyar-brown focus:bg-white focus:ring-1 focus:ring-diyar-brown ${
          isCompact ? 'py-2.5 px-3 text-sm' : 'py-3 pl-3 pr-3'
        }`}
        placeholder="501234567"
        dir="ltr"
      />
    </div>
  );
}
