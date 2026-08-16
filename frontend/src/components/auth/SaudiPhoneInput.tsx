import { SAUDI_PHONE_DIGITS, sanitizeSaudiPhoneInput } from '../../lib/auth/validation.ts';

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
  return (
    <div className="relative flex min-w-0">
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        pattern="5[0-9]{8}"
        required
        value={value}
        onChange={(e) => onChange(sanitizeSaudiPhoneInput(e.target.value))}
        autoComplete={autoComplete}
        maxLength={SAUDI_PHONE_DIGITS}
        className="flex-1 min-w-0 pl-3 pr-3 py-3 border border-gray-200 rounded-r-xl focus:ring-1 focus:ring-diyar-brown focus:border-diyar-brown outline-none transition-colors"
        placeholder="501234567"
        dir="ltr"
      />
      <div
        className="bg-gray-50 border border-gray-200 border-s-0 rounded-l-xl px-3 sm:px-4 flex items-center justify-center font-bold text-gray-600 shrink-0"
        dir="ltr"
      >
        +966
      </div>
    </div>
  );
}
