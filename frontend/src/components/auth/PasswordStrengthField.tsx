import { Eye, EyeOff, Lock } from 'lucide-react';
import { useLocale } from '../../hooks/useLocale.ts';
import {
  getPasswordStrength,
  PASSWORD_REQUIREMENT_KEYS,
  passwordStrengthLabelKey,
  type PasswordStrengthLevel,
} from '../../lib/auth/validation.ts';
import {
  AuthInputIcon,
  AuthInputToggle,
  getPasswordIconPositions,
  type FieldDirection,
} from './AuthInputIcon.tsx';

const passwordInputClassName =
  'w-full min-w-0 border-0 bg-transparent py-3 ps-10 pe-10 text-base leading-normal text-start outline-none focus:ring-0';

const strengthTheme: Record<
  PasswordStrengthLevel,
  { ring: string; bar: string; text: string; glow: string }
> = {
  empty: {
    ring: 'ring-gray-200',
    bar: 'bg-gray-300',
    text: 'text-gray-400',
    glow: '',
  },
  weak: {
    ring: 'ring-red-400',
    bar: 'bg-red-500',
    text: 'text-red-600',
    glow: 'shadow-[0_0_0_1px_rgba(239,68,68,0.15)]',
  },
  fair: {
    ring: 'ring-amber-400',
    bar: 'bg-amber-400',
    text: 'text-amber-600',
    glow: 'shadow-[0_0_0_1px_rgba(251,191,36,0.2)]',
  },
  good: {
    ring: 'ring-lime-500',
    bar: 'bg-lime-500',
    text: 'text-lime-600',
    glow: 'shadow-[0_0_0_1px_rgba(132,204,22,0.2)]',
  },
  strong: {
    ring: 'ring-green-500',
    bar: 'bg-green-500',
    text: 'text-green-600',
    glow: 'shadow-[0_0_0_1px_rgba(34,197,94,0.25)]',
  },
};

type PasswordStrengthFieldProps = {
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  showStrength?: boolean;
  autoComplete?: string;
  placeholder?: string;
  direction?: FieldDirection;
};

export function PasswordStrengthField({
  value,
  onChange,
  showPassword,
  onToggleShow,
  showStrength = true,
  autoComplete = 'new-password',
  placeholder = '••••••••',
  direction = 'rtl',
}: PasswordStrengthFieldProps) {
  const { t } = useLocale();
  const strength = getPasswordStrength(value);
  const theme = strengthTheme[strength.level];
  const showMeter = showStrength && value.length > 0;
  const icons = getPasswordIconPositions(direction);
  const strengthLabelKey = passwordStrengthLabelKey(strength.level);

  return (
    <div className="space-y-2">
      <div
        className={`overflow-hidden rounded-xl bg-white ring-2 transition-all duration-300 ease-out ${theme.ring} ${showMeter ? theme.glow : ''}`}
      >
        <div className="relative" dir={direction}>
          <AuthInputIcon position={icons.lock}>
            <Lock size={18} strokeWidth={2} className="block" />
          </AuthInputIcon>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={value}
            onChange={(e) => onChange(e.target.value)}
            autoComplete={autoComplete}
            className={passwordInputClassName}
            placeholder={placeholder}
            dir="ltr"
          />
          <AuthInputToggle
            position={icons.toggle}
            onClick={onToggleShow}
            label={showPassword ? t('validation.hidePassword') : t('validation.showPassword')}
          >
            {showPassword ? (
              <EyeOff size={18} strokeWidth={2} />
            ) : (
              <Eye size={18} strokeWidth={2} />
            )}
          </AuthInputToggle>
        </div>

        {showStrength && (
          <div className="h-1.5 overflow-hidden bg-gray-100">
            <div
              className={`h-full transition-all duration-500 ease-out ${theme.bar}`}
              style={{ width: value ? `${strength.score}%` : '0%' }}
            />
          </div>
        )}
      </div>

      {showStrength && value.length > 0 && strengthLabelKey && (
        <div className="space-y-2 animate-in fade-in duration-300">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold transition-colors duration-300 ${theme.text}`}>
              {t(strengthLabelKey)}
            </span>
            <span className="text-[10px] font-medium text-gray-400">{strength.score}%</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PASSWORD_REQUIREMENT_KEYS.map((requirement) => {
              const met = strength.checks[requirement.key];
              return (
                <span
                  key={requirement.key}
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold transition-all duration-300 ${
                    met
                      ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
                      : strength.level === 'fair'
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                        : 'bg-red-50 text-red-600 ring-1 ring-red-100'
                  }`}
                >
                  {met ? '✓' : '○'} {t(requirement.labelKey)}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

type PasswordInputProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
  autoComplete?: string;
  direction?: FieldDirection;
};

export function PasswordInput({
  id,
  value,
  onChange,
  showPassword,
  onToggleShow,
  autoComplete = 'current-password',
  direction = 'rtl',
}: PasswordInputProps) {
  const { t } = useLocale();
  const icons = getPasswordIconPositions(direction);

  return (
    <div
      className="relative rounded-xl border border-gray-200 transition-colors focus-within:border-diyar-brown focus-within:ring-1 focus-within:ring-diyar-brown"
      dir={direction}
    >
      <AuthInputIcon position={icons.lock}>
        <Lock size={18} strokeWidth={2} className="block" />
      </AuthInputIcon>
      <input
        id={id}
        type={showPassword ? 'text' : 'password'}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        className={`${passwordInputClassName} rounded-xl`}
        placeholder="••••••••"
        dir="ltr"
      />
      <AuthInputToggle
        position={icons.toggle}
        onClick={onToggleShow}
        label={showPassword ? t('validation.hidePassword') : t('validation.showPassword')}
      >
        {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
      </AuthInputToggle>
    </div>
  );
}
