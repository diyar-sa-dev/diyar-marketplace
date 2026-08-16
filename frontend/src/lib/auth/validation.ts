export function resolveLoginMethod(identifier: string): 'phone' | 'email' {
  const trimmed = identifier.trim();
  return trimmed.includes('@') ? 'email' : 'phone';
}

export function isValidPasswordClient(value: string): boolean {
  if (value.length < 8) {
    return false;
  }

  return /[A-Za-z]/.test(value) && /\d/.test(value);
}

export function passwordsMatch(password: string, confirmation: string): boolean {
  return password === confirmation;
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export type PasswordStrengthChecks = {
  minLength: boolean;
  hasLetter: boolean;
  hasNumber: boolean;
  hasMixedCase: boolean;
  hasSpecial: boolean;
};

export type PasswordStrength = {
  level: PasswordStrengthLevel;
  score: number;
  checks: PasswordStrengthChecks;
};

export function getPasswordStrength(value: string): PasswordStrength {
  const checks: PasswordStrengthChecks = {
    minLength: value.length >= 8,
    hasLetter: /[A-Za-z]/.test(value),
    hasNumber: /\d/.test(value),
    hasMixedCase: /[a-z]/.test(value) && /[A-Z]/.test(value),
    hasSpecial: /[^A-Za-z0-9]/.test(value),
  };

  if (!value) {
    return { level: 'empty', score: 0, checks };
  }

  const requiredCount = [checks.minLength, checks.hasLetter, checks.hasNumber].filter(
    Boolean,
  ).length;

  let score = 0;
  if (checks.minLength) score += 34;
  if (checks.hasLetter) score += 33;
  if (checks.hasNumber) score += 33;
  if (checks.hasMixedCase) score += 8;
  if (checks.hasSpecial) score += 8;
  if (value.length >= 12) score += 8;

  score = Math.min(100, score);

  if (requiredCount === 3 && (checks.hasMixedCase || checks.hasSpecial || value.length >= 12)) {
    return { level: 'strong', score: 100, checks };
  }

  if (requiredCount === 3) {
    return { level: 'good', score: Math.max(score, 78), checks };
  }

  if (requiredCount === 2) {
    return { level: 'fair', score: Math.max(score, 52), checks };
  }

  return { level: 'weak', score: Math.max(score, 22), checks };
}

export const PASSWORD_REQUIREMENT_KEYS = [
  { key: 'minLength' as const, labelKey: 'validation.passwordRequirements.minLength' },
  { key: 'hasLetter' as const, labelKey: 'validation.passwordRequirements.hasLetter' },
  { key: 'hasNumber' as const, labelKey: 'validation.passwordRequirements.hasNumber' },
] as const;

/** Saudi mobile without country code: 5XXXXXXXX (9 digits). */
export const SAUDI_PHONE_DIGITS = 9;
export const SAUDI_PHONE_PATTERN = /^5\d{8}$/;

export const NAME_MIN_LENGTH = 2;
export const NAME_MAX_LENGTH = 255;

export function sanitizeSaudiPhoneInput(value: string): string {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('00966')) {
    digits = digits.slice(5);
  } else if (digits.startsWith('966')) {
    digits = digits.slice(3);
  } else if (digits.startsWith('0')) {
    digits = digits.slice(1);
  }

  return digits.slice(0, SAUDI_PHONE_DIGITS);
}

export function isValidSaudiPhoneNational(value: string): boolean {
  return SAUDI_PHONE_PATTERN.test(value);
}

export function isValidNameClient(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length >= NAME_MIN_LENGTH && trimmed.length <= NAME_MAX_LENGTH;
}

export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) {
    return '';
  }

  if (phone.startsWith('966')) {
    return `0${phone.slice(3)}`;
  }

  return phone;
}

/** Mask phone for OTP screens: first digit + asterisks + last digit (e.g. 501234567 → 5******7). */
export function maskPhoneForDisplay(phone: string | null | undefined): string {
  const digits = (phone ?? '').replace(/\D/g, '');

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits[0]}${'*'.repeat(digits.length - 2)}${digits[digits.length - 1]}`;
}

export function passwordStrengthLabelKey(level: PasswordStrengthLevel): string | null {
  if (level === 'empty') {
    return null;
  }

  return `validation.passwordStrength.${level}`;
}
