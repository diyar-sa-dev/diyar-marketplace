const DEFAULT_PHONE = '+966500000000';
const DEFAULT_EMAIL = 'support@diyar.com';
const DEFAULT_HOURS = '9:00 - 18:00';

export function getPlatformSupportPhone(): string {
  return import.meta.env.VITE_PLATFORM_SUPPORT_PHONE?.trim() || DEFAULT_PHONE;
}

export function getPlatformSupportEmail(): string {
  return import.meta.env.VITE_PLATFORM_SUPPORT_EMAIL?.trim() || DEFAULT_EMAIL;
}

export function getPlatformSupportHours(): string {
  return import.meta.env.VITE_PLATFORM_SUPPORT_HOURS?.trim() || DEFAULT_HOURS;
}

export function getPlatformSupportPhoneDisplay(): string {
  const explicit = import.meta.env.VITE_PLATFORM_SUPPORT_PHONE_DISPLAY?.trim();
  if (explicit) {
    return explicit;
  }

  const phone = getPlatformSupportPhone();
  if (/\s/.test(phone)) {
    return phone;
  }

  const digits = phone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('9665')) {
    return `+966 ${digits.slice(3, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  return phone;
}

export function getPlatformSupportTelHref(): string {
  return `tel:${getPlatformSupportPhone().replace(/\s+/g, '')}`;
}

export function getPlatformSupportMailHref(): string {
  return `mailto:${getPlatformSupportEmail()}`;
}
