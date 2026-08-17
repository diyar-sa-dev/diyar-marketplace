import Swal from 'sweetalert2';
import type { TranslateFn } from './i18n/types.ts';

export type PaymentOutcome = 'paid' | 'failed' | 'expired';

const swalCustomClass = {
  popup: 'diyar-swal diyar-payment-swal',
  title: 'diyar-payment-swal-title',
  htmlContainer: 'diyar-payment-swal-body',
  confirmButton: 'diyar-payment-swal-btn',
};

const outcomeConfig: Record<
  PaymentOutcome,
  {
    variant: string;
    titleKey: string;
    bodyKey: string;
    confirmKey: string;
    confirmColor: string;
    iconMarkup: string;
  }
> = {
  paid: {
    variant: 'success',
    titleKey: 'orders.paymentOutcomeSuccessTitle',
    bodyKey: 'orders.paymentOutcomeSuccessBody',
    confirmKey: 'orders.paymentOutcomeContinue',
    confirmColor: '#16a34a',
    iconMarkup: `
      <svg viewBox="0 0 52 52" class="diyar-payment-svg diyar-payment-svg--success" aria-hidden="true">
        <circle class="diyar-payment-svg-circle" cx="26" cy="26" r="24" fill="none"/>
        <path class="diyar-payment-svg-check" fill="none" d="M14 27l8 8 16-18"/>
      </svg>
    `,
  },
  failed: {
    variant: 'failed',
    titleKey: 'orders.paymentOutcomeFailedTitle',
    bodyKey: 'orders.paymentOutcomeFailedBody',
    confirmKey: 'orders.paymentOutcomeRetry',
    confirmColor: '#dc2626',
    iconMarkup: `
      <svg viewBox="0 0 52 52" class="diyar-payment-svg diyar-payment-svg--failed" aria-hidden="true">
        <circle class="diyar-payment-svg-circle" cx="26" cy="26" r="24" fill="none"/>
        <path class="diyar-payment-svg-x" fill="none" d="M18 18l16 16M34 18L18 34"/>
      </svg>
    `,
  },
  expired: {
    variant: 'expired',
    titleKey: 'orders.paymentOutcomeExpiredTitle',
    bodyKey: 'orders.paymentOutcomeExpiredBody',
    confirmKey: 'orders.paymentOutcomeRetry',
    confirmColor: '#d97706',
    iconMarkup: `
      <svg viewBox="0 0 52 52" class="diyar-payment-svg diyar-payment-svg--expired" aria-hidden="true">
        <circle class="diyar-payment-svg-circle" cx="26" cy="26" r="24" fill="none"/>
        <path class="diyar-payment-svg-clock" fill="none" d="M26 14v12l8 5"/>
      </svg>
    `,
  },
};

function buildOutcomeHtml(t: TranslateFn, outcome: PaymentOutcome, orderNumber?: string): string {
  const config = outcomeConfig[outcome];
  const orderBadge = orderNumber
    ? `<div class="diyar-payment-order-badge"><span>${t('orders.orderNumber')}</span><strong>${orderNumber}</strong></div>`
    : '';

  return `
    <div class="diyar-payment-outcome diyar-payment-outcome--${config.variant}">
      <div class="diyar-payment-icon-wrap">${config.iconMarkup}</div>
      <p class="diyar-payment-message">${t(config.bodyKey)}</p>
      ${orderBadge}
    </div>
  `;
}

export async function showPaymentOutcomeAlert(
  t: TranslateFn,
  outcome: PaymentOutcome,
  orderNumber?: string,
): Promise<void> {
  const config = outcomeConfig[outcome];

  await Swal.fire({
    customClass: {
      ...swalCustomClass,
      popup: `diyar-swal diyar-payment-swal diyar-payment-swal--${config.variant}`,
    },
    title: t(config.titleKey),
    html: buildOutcomeHtml(t, outcome, orderNumber),
    showConfirmButton: true,
    confirmButtonText: t(config.confirmKey),
    confirmButtonColor: config.confirmColor,
    buttonsStyling: true,
    reverseButtons: true,
    allowOutsideClick: true,
    allowEscapeKey: true,
    focusConfirm: true,
    showClass: {
      popup: 'diyar-payment-swal-show',
      backdrop: 'swal2-backdrop-show',
    },
    hideClass: {
      popup: 'diyar-payment-swal-hide',
    },
  });
}

export function paymentOutcomeToHighlightTone(
  outcome: PaymentOutcome,
): 'success' | 'failed' | 'expired' {
  if (outcome === 'paid') {
    return 'success';
  }

  if (outcome === 'failed') {
    return 'failed';
  }

  return 'expired';
}
