import { maxBookingIsoDate, validateDirectBookingSchedule } from './directBookingSchedule.ts';

const MAX_QUOTATION_BYTES = 10 * 1024 * 1024;
const ALLOWED_QUOTATION_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export type ProviderOfferFormErrors = {
  offerPrice?: string;
  offerMessage?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  quotation?: string;
};

export function validateQuotationFile(file: File): string | null {
  if (!ALLOWED_QUOTATION_TYPES.includes(file.type)) {
    return 'invalidType';
  }
  if (file.size > MAX_QUOTATION_BYTES) {
    return 'tooLarge';
  }
  return null;
}

export function parseBudgetBounds(
  budgetMin?: string | null,
  budgetMax?: string | null,
): { min: number | null; max: number | null } {
  const min = budgetMin != null && budgetMin !== '' ? Number(budgetMin) : null;
  const max = budgetMax != null && budgetMax !== '' ? Number(budgetMax) : null;
  return {
    min: min != null && !Number.isNaN(min) ? min : null,
    max: max != null && !Number.isNaN(max) ? max : null,
  };
}

export function validateProviderOfferForm(input: {
  offerPrice: string;
  offerMessage: string;
  scheduledDate: string;
  scheduledTime: string;
  quotationFile: File | null;
  budgetMin?: string | null;
  budgetMax?: string | null;
  t: (key: string, params?: Record<string, string | number>) => string;
}): ProviderOfferFormErrors {
  const errors: ProviderOfferFormErrors = {};
  const priceRaw = input.offerPrice.trim();

  if (!priceRaw) {
    errors.offerPrice = input.t('providerDashboard.clientRequestDetails.validation.priceRequired');
  } else if (!/^\d+(\.\d{1,2})?$/.test(priceRaw)) {
    errors.offerPrice = input.t('providerDashboard.clientRequestDetails.validation.priceDigits');
  } else {
    const price = Number(priceRaw);
    if (price < 10) {
      errors.offerPrice = input.t('providerDashboard.clientRequestDetails.validation.priceMin');
    } else {
      const { min, max } = parseBudgetBounds(input.budgetMin, input.budgetMax);
      if (min != null && max != null && (price < min || price > max)) {
        errors.offerPrice = input.t(
          'providerDashboard.clientRequestDetails.validation.priceWithinBudget',
          {
            min,
            max,
          },
        );
      } else if (min != null && max == null && price < min) {
        errors.offerPrice = input.t(
          'providerDashboard.clientRequestDetails.validation.priceMinBudget',
          { min },
        );
      } else if (max != null && min == null && price > max) {
        errors.offerPrice = input.t(
          'providerDashboard.clientRequestDetails.validation.priceMaxBudget',
          { max },
        );
      }
    }
  }

  const message = input.offerMessage.trim();
  if (!message) {
    errors.offerMessage = input.t(
      'providerDashboard.clientRequestDetails.validation.messageRequired',
    );
  } else if (message.length < 10) {
    errors.offerMessage = input.t('providerDashboard.clientRequestDetails.validation.messageMin');
  }

  if (input.scheduledDate && !input.scheduledTime) {
    errors.scheduledTime = input.t(
      'providerDashboard.clientRequestDetails.validation.timeRequired',
    );
  }
  if (input.scheduledTime && !input.scheduledDate) {
    errors.scheduledDate = input.t(
      'providerDashboard.clientRequestDetails.validation.dateRequired',
    );
  }

  if (input.scheduledDate && input.scheduledTime) {
    const scheduleError = validateDirectBookingSchedule(input.scheduledDate, input.scheduledTime);
    if (scheduleError === 'directBooking.scheduleTooSoon') {
      errors.scheduledTime = input.t(
        'providerDashboard.clientRequestDetails.validation.scheduleTooSoon',
      );
    } else if (scheduleError === 'directBooking.scheduleOutOfRange') {
      errors.scheduledDate = input.t(
        'providerDashboard.clientRequestDetails.validation.scheduleOutOfRange',
        {
          maxDate: maxBookingIsoDate(),
        },
      );
    } else if (scheduleError) {
      errors.scheduledDate = input.t(
        'providerDashboard.clientRequestDetails.validation.scheduleInvalid',
      );
    }
  }

  if (input.quotationFile) {
    const fileError = validateQuotationFile(input.quotationFile);
    if (fileError === 'invalidType') {
      errors.quotation = input.t('providerDashboard.clientRequestDetails.validation.quotationType');
    } else if (fileError === 'tooLarge') {
      errors.quotation = input.t('providerDashboard.clientRequestDetails.validation.quotationSize');
    }
  }

  return errors;
}
