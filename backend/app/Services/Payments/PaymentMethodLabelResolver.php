<?php

namespace App\Services\Payments;

use App\Enums\PaymentStatus;
use App\Models\Payment;

final class PaymentMethodLabelResolver
{
    public function resolve(?Payment $payment): ?string
    {
        if ($payment === null) {
            return null;
        }

        if (in_array($payment->status, [PaymentStatus::Pending, PaymentStatus::Authorized], true)) {
            return __('diyar.payment.method_pending');
        }

        if ($payment->status === PaymentStatus::Paid) {
            return $this->labelForPaidPayment($payment);
        }

        if ($payment->status === PaymentStatus::Refunded) {
            return __('diyar.payment.method_refunded');
        }

        if (in_array($payment->status, [PaymentStatus::Failed, PaymentStatus::Expired, PaymentStatus::Cancelled], true)) {
            return __('diyar.payment.method_failed');
        }

        return null;
    }

    private function labelForPaidPayment(Payment $payment): string
    {
        $code = $payment->payment_method;

        if ($code === null && $payment->relationLoaded('attempts')) {
            $attempt = $payment->attempts
                ->sortByDesc(fn ($item) => $item->updated_at ?? $item->created_at)
                ->first();

            $code = is_array($attempt?->metadata) ? ($attempt->metadata['payment_method'] ?? null) : null;
        }

        if ($code === null && $payment->gateway === 'manual') {
            $code = 'manual';
        }

        return $this->labelForCode($code, $payment->gateway);
    }

    private function labelForCode(?string $code, ?string $gateway): string
    {
        if ($code !== null && $code !== '') {
            return match (strtolower($code)) {
                'manual', 'cash' => __('diyar.payment.method_manual_paid'),
                'mada', 'md' => __('diyar.payment.method_electronic_mada'),
                'visa_master', 'vm', 'visa', 'master', 'card', 'creditcard' => __('diyar.payment.method_electronic_visa'),
                'apple_pay', 'ap' => __('diyar.payment.method_electronic_apple_pay'),
                'google_pay', 'gp' => __('diyar.payment.method_electronic_google_pay'),
                'tabby' => __('diyar.payment.method_electronic_tabby'),
                'knet', 'kn' => __('diyar.payment.method_electronic_knet'),
                default => __('diyar.payment.method_electronic'),
            };
        }

        return match ($gateway) {
            'manual' => __('diyar.payment.method_manual_paid'),
            default => __('diyar.payment.method_electronic'),
        };
    }
}
