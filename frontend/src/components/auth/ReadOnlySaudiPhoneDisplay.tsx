import { toSaudiPhoneNationalInput } from '../../lib/auth/validation.ts';

type ReadOnlySaudiPhoneDisplayProps = {
  phone: string | null | undefined;
  id?: string;
};

export function ReadOnlySaudiPhoneDisplay({ phone, id }: ReadOnlySaudiPhoneDisplayProps) {
  const nationalValue = toSaudiPhoneNationalInput(phone);

  return (
    <div className="relative flex min-w-0" dir="ltr">
      <div className="flex items-center justify-center shrink-0 rounded-l-xl border border-gray-200 border-e-0 bg-gray-100 px-3 font-bold text-gray-600 sm:px-4">
        +966
      </div>
      <input
        id={id}
        type="tel"
        value={nationalValue}
        disabled
        readOnly
        tabIndex={-1}
        className="min-w-0 flex-1 cursor-not-allowed rounded-r-xl border border-gray-200 bg-gray-50 py-3 pl-3 pr-3 text-gray-700 opacity-100"
        dir="ltr"
      />
    </div>
  );
}
