import { formatSaudiPhoneInputDisplay, toSaudiPhoneNationalInput } from '../../lib/auth/validation.ts';

type ReadOnlySaudiPhoneDisplayProps = {
  phone: string | null | undefined;
  id?: string;
};

export function ReadOnlySaudiPhoneDisplay({ phone, id }: ReadOnlySaudiPhoneDisplayProps) {
  const displayValue = formatSaudiPhoneInputDisplay(toSaudiPhoneNationalInput(phone));

  return (
    <input
      id={id}
      type="tel"
      value={displayValue}
      disabled
      readOnly
      tabIndex={-1}
      className="w-full min-w-0 cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3 px-3 font-mono text-gray-700 opacity-100"
      dir="ltr"
    />
  );
}
