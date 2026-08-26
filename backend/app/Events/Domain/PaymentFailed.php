<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\Payment;
use App\Support\Notifications\NotificationUrlSupport;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class PaymentFailed implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Payment $payment,
        public readonly ?string $reason = null,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->payment->loadMissing('order.user');

        return new NotificationIntent(
            type: NotificationType::PaymentFailed,
            recipients: array_filter([$this->payment->order?->user]),
            payload: [
                'order_number' => $this->payment->order?->order_number,
                'order_id' => $this->payment->order_id,
                'amount' => (string) $this->payment->amount,
                'reason' => $this->reason,
                'action_url' => NotificationUrlSupport::orderUrl((string) $this->payment->order_id, 'failed'),
            ],
            entityType: 'payment',
            entityId: $this->payment->id,
            dedupeKey: "payment.failed:{$this->payment->id}",
        );
    }
}
