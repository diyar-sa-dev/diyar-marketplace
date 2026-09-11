import { useId, useRef } from 'react';
import { AuthFieldLabel } from './AuthInputIcon.tsx';

type OtpCodeFieldProps = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  required?: boolean;
  centered?: boolean;
  labelDir?: 'ltr' | 'rtl';
};

export function OtpCodeField({
  label,
  placeholder = '000000',
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  required = false,
  centered = false,
  labelDir,
}: OtpCodeFieldProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div dir={labelDir}>
      <AuthFieldLabel
        htmlFor={inputId}
        required={required}
        className={centered ? 'text-center' : undefined}
      >
        {label}
      </AuthFieldLabel>
      <div className={centered ? 'flex justify-center' : undefined}>
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          maxLength={6}
          dir="ltr"
          lang="en"
          autoFocus={autoFocus}
          disabled={disabled}
          required={required}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
          className={`mt-2 min-w-0 rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-xl sm:text-2xl font-bold tracking-[0.35em] sm:tracking-[0.45em] text-diyar-dark outline-none transition focus:border-diyar-brown focus:ring-2 focus:ring-diyar-brown/20 disabled:opacity-60 placeholder:text-gray-300 placeholder:tracking-[0.35em] sm:placeholder:tracking-[0.45em] ${
            centered ? 'w-full max-w-xs' : 'w-full'
          }`}
          aria-label={label}
        />
      </div>
    </div>
  );
}
