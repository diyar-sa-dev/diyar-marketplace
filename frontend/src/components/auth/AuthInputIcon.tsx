import type { ReactNode } from 'react';
import { CircleHelp, Mail } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';

export type FieldDirection = 'ltr' | 'rtl';

export function getPasswordIconPositions(direction: FieldDirection) {
  return direction === 'rtl'
    ? { lock: 'end' as const, toggle: 'start' as const }
    : { lock: 'start' as const, toggle: 'end' as const };
}

type AuthFieldHintIconProps = {
  hint: string;
};

export function AuthFieldHintIcon({ hint }: AuthFieldHintIconProps) {
  const { dir } = useLocale();

  return (
    <span className="group/hint relative inline-flex align-middle">
      <button
        type="button"
        tabIndex={0}
        className="inline-flex size-4.5 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-diyar-brown cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-diyar-brown/40"
        aria-label={hint}
      >
        <CircleHelp size={15} strokeWidth={2} />
      </button>
      <span
        role="tooltip"
        dir={dir}
        className={`pointer-events-none absolute bottom-full z-20 mb-2 w-max max-w-56 rounded-lg bg-diyar-dark px-3 py-2 text-xs font-normal leading-relaxed text-white text-start opacity-0 shadow-lg transition-opacity group-hover/hint:opacity-100 group-focus-within/hint:opacity-100 ${
          dir === 'rtl' ? 'right-0' : 'left-0'
        }`}
      >
        {hint}
      </span>
    </span>
  );
}

type AuthFieldLabelProps = {
  children: ReactNode;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  hint?: string;
};

export function AuthFieldLabel({
  children,
  required = false,
  htmlFor,
  className = 'mb-2',
  hint,
}: AuthFieldLabelProps) {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-bold text-gray-700 ${className}`}>
      <span className="inline-flex items-center gap-1.5">
        <span>
          {children}
          {required && (
            <span className="text-red-500 font-bold ms-0.5" aria-hidden="true">
              *
            </span>
          )}
        </span>
        {hint && <AuthFieldHintIcon hint={hint} />}
      </span>
    </label>
  );
}

type AuthInputIconProps = {
  children: ReactNode;
  position?: 'start' | 'end';
};

export function AuthInputIcon({ children, position = 'start' }: AuthInputIconProps) {
  return (
    <span
      className={`pointer-events-none absolute top-1/2 -translate-y-1/2 flex size-4.5 items-center justify-center text-gray-400 ${
        position === 'start' ? 'inset-s-3' : 'inset-e-3'
      }`}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}

type AuthInputToggleProps = {
  onClick: () => void;
  label: string;
  children: ReactNode;
  position?: 'start' | 'end';
};

export function AuthInputToggle({
  onClick,
  label,
  children,
  position = 'end',
}: AuthInputToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 -translate-y-1/2 flex size-4.5 items-center justify-center text-gray-400 transition-colors hover:text-gray-600 cursor-pointer ${
        position === 'start' ? 'inset-s-3' : 'inset-e-3'
      }`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

type AuthEmailInputProps = {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  autoComplete?: string;
  placeholder?: string;
  direction?: FieldDirection;
};

export function AuthEmailInput({
  value,
  onChange,
  required = false,
  autoComplete = 'email',
  placeholder = 'example@email.com',
  direction = 'rtl',
}: AuthEmailInputProps) {
  const iconPosition = direction === 'rtl' ? 'end' : 'start';

  return (
    <div className="relative" dir={direction}>
      <AuthInputIcon position={iconPosition}>
        <Mail size={18} strokeWidth={2} className="block" />
      </AuthInputIcon>
      <input
        type="email"
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className="w-full min-w-0 rounded-xl border border-gray-200 py-3 ps-10 pe-10 text-base leading-normal text-start outline-none transition-colors focus:border-diyar-brown focus:ring-1 focus:ring-diyar-brown"
        placeholder={placeholder}
        dir="ltr"
      />
    </div>
  );
}
