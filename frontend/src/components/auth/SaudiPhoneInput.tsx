import { SAUDI_PHONE_DIGITS, sanitizeSaudiPhoneInput, toSaudiPhoneNationalInput } from '../../lib/auth/validation.ts';

type SaudiPhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  id?: string;
};

export function SaudiPhoneInput({
  value,
  onChange,
  autoComplete = 'tel',
  id,
}: SaudiPhoneInputProps) {
  const nationalPhone = toSaudiPhoneNationalInput(value);

  return (
    <div className="relative flex min-w-0" dir="ltr">
      <div className="flex items-center justify-center shrink-0 rounded-l-xl border border-gray-200 border-e-0 bg-gray-50 px-3 font-bold text-gray-600 sm:px-4">
        +966
      </div>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="5[0-9]{8}"
        required
        value={nationalPhone}
        onChange={(e) => onChange(sanitizeSaudiPhoneInput(e.target.value))}
        autoComplete={autoComplete}
        maxLength={SAUDI_PHONE_DIGITS}
        className="min-w-0 flex-1 rounded-r-xl border border-gray-200 py-3 pl-3 pr-3 outline-none transition-colors focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown"
        placeholder="501234567"
        dir="ltr"
      />
    </div>
  );
}
