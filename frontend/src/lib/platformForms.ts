import type { TranslateFn } from './i18n/types.ts';
import { isValidSaudiPhoneNational } from './auth/validation.ts';

export function validateConsultationForm(
  form: { name: string; phone: string; email: string; message: string },
  t: TranslateFn,
): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = form.name.trim();
  const phone = form.phone.trim();
  const email = form.email.trim();
  const message = form.message.trim();

  if (name.length < 2) {
    errors.name = t('layout.consultation.nameRequired');
  }

  if (phone === '') {
    errors.phone = t('layout.consultation.phoneRequired');
  } else if (!isValidSaudiPhoneNational(phone)) {
    errors.phone = t('layout.consultation.phoneInvalid');
  }

  if (email === '') {
    errors.email = t('layout.consultation.emailRequired');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = t('layout.consultation.emailInvalid');
  }

  if (message === '') {
    errors.message = t('layout.consultation.messageRequired');
  } else if (message.length < 5) {
    errors.message = t('layout.consultation.messageMin');
  }

  return errors;
}

export function validateNewsletterEmail(email: string, t: TranslateFn): string | null {
  const value = email.trim();

  if (value === '') {
    return t('home.newsletter.emailRequired');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return t('home.newsletter.emailInvalid');
  }

  return null;
}
