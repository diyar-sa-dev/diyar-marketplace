<?php

namespace App\Services\Order;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use InvalidArgumentException;

final class PaymentStateService
{
    /** @var array<string, list<PaymentStatus>> */
    private const TRANSITIONS = [
        'pending' => [
            PaymentStatus::Authorized,
            PaymentStatus::Paid,
            PaymentStatus::Failed,
            PaymentStatus::Cancelled,
            PaymentStatus::Expired,
        ],
        'authorized' => [PaymentStatus::Paid, PaymentStatus::Failed, PaymentStatus::Cancelled, PaymentStatus::Expired],
        'paid' => [PaymentStatus::PartiallyRefunded, PaymentStatus::Refunded],
        'failed' => [PaymentStatus::Pending],
        'cancelled' => [],
        'expired' => [PaymentStatus::Pending],
    ];

    public function assertCanTransition(Payment $payment, PaymentStatus $to): void
    {
        $allowed = self::TRANSITIONS[$payment->status->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw new InvalidArgumentException(__('diyar.order.invalid_payment_transition'));
        }
    }

    public function transition(Payment $payment, PaymentStatus $to, array $attributes = []): Payment
    {
        $this->assertCanTransition($payment, $to);

        $updates = array_merge(['status' => $to], $attributes);

        if ($to === PaymentStatus::Paid) {
            $updates['paid_at'] = $updates['paid_at'] ?? now();
        }

        if (in_array($to, [PaymentStatus::Failed, PaymentStatus::Cancelled, PaymentStatus::Expired], true)) {
            $updates['failed_at'] = $updates['failed_at'] ?? now();
        }

        if ($to === PaymentStatus::Pending) {
            $updates['failed_at'] = null;
            $updates['failure_reason'] = null;
        }

        $payment->update($updates);

        return $payment->fresh();
    }
}
