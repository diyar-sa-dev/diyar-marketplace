<?php

namespace App\Services\Order;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\PaymentStateTransition;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Authoritative payment lifecycle state machine.
 *
 * All payment status mutations must pass through this service.
 */
final class PaymentStateService
{
    /** @var array<string, list<PaymentStatus>> */
    private const TRANSITIONS = [
        'pending' => [
            PaymentStatus::Processing,
            PaymentStatus::RequiresAction,
            PaymentStatus::Authorized,
            PaymentStatus::Paid,
            PaymentStatus::Failed,
            PaymentStatus::Cancelled,
            PaymentStatus::Expired,
            PaymentStatus::Unknown,
        ],
        'processing' => [
            PaymentStatus::RequiresAction,
            PaymentStatus::Authorized,
            PaymentStatus::Paid,
            PaymentStatus::Failed,
            PaymentStatus::Cancelled,
            PaymentStatus::Expired,
            PaymentStatus::Unknown,
        ],
        'requires_action' => [
            PaymentStatus::Processing,
            PaymentStatus::Authorized,
            PaymentStatus::Paid,
            PaymentStatus::Failed,
            PaymentStatus::Cancelled,
            PaymentStatus::Unknown,
        ],
        'authorized' => [
            PaymentStatus::Paid,
            PaymentStatus::Failed,
            PaymentStatus::Cancelled,
            PaymentStatus::Expired,
            PaymentStatus::Unknown,
        ],
        'unknown' => [
            PaymentStatus::Processing,
            PaymentStatus::Paid,
            PaymentStatus::Failed,
            PaymentStatus::Cancelled,
        ],
        'paid' => [
            PaymentStatus::Refunding,
            PaymentStatus::PartiallyRefunded,
            PaymentStatus::Refunded,
        ],
        'refunding' => [
            PaymentStatus::PartiallyRefunded,
            PaymentStatus::Refunded,
            PaymentStatus::Failed,
        ],
        'partially_refunded' => [
            PaymentStatus::Refunding,
            PaymentStatus::PartiallyRefunded,
            PaymentStatus::Refunded,
        ],
        'failed' => [PaymentStatus::Pending],
        'expired' => [PaymentStatus::Pending],
        'cancelled' => [],
        'refunded' => [],
    ];

    public function assertCanTransition(Payment $payment, PaymentStatus $to): void
    {
        if ($payment->status === $to) {
            return;
        }

        $allowed = self::TRANSITIONS[$payment->status->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw new InvalidArgumentException(__('diyar.order.invalid_payment_transition'));
        }
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function transition(
        Payment $payment,
        PaymentStatus $to,
        array $attributes = [],
        string $source = 'system',
        ?string $correlationId = null,
    ): Payment {
        if ($payment->status === $to) {
            if ($attributes !== []) {
                $payment->update($attributes);

                return $payment->fresh();
            }

            return $payment;
        }

        $this->assertCanTransition($payment, $to);

        $from = $payment->status;
        $correlationId ??= (string) Str::uuid();
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

        PaymentStateTransition::query()->create([
            'payment_id' => $payment->id,
            'from_status' => $from->value,
            'to_status' => $to->value,
            'source' => $source,
            'correlation_id' => $correlationId,
            'metadata' => array_filter([
                'order_id' => $payment->order_id,
            ]),
            'created_at' => now(),
        ]);

        Log::info('payment.state.transition', [
            'payment_id' => $payment->id,
            'order_id' => $payment->order_id,
            'from' => $from->value,
            'to' => $to->value,
            'source' => $source,
            'correlation_id' => $correlationId,
        ]);

        return $payment->fresh();
    }
}
