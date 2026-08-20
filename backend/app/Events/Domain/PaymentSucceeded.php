<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\Payment;
use App\Services\Notifications\NotificationContextBuilder;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class PaymentSucceeded implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Payment $payment,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->payment->loadMissing(['order.user', 'order.vendorOrders.items']);

        $order = $this->payment->order;
        $builder = app(NotificationContextBuilder::class);
        $products = $order !== null ? $builder->summarizeOrderItems($order) : '';

        return new NotificationIntent(
            type: NotificationType::PaymentSuccess,
            recipients: array_filter([$order?->user]),
            payload: [
                'order_number' => $order?->order_number,
                'amount' => (string) $this->payment->amount,
                'products' => $products,
                'detail_lines' => $order !== null ? $builder->orderDetailLines($order) : [],
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/orders/'.$this->payment->order_id,
            ],
            entityType: 'payment',
            entityId: $this->payment->id,
            dedupeKey: "payment.success:{$this->payment->id}",
        );
    }
}
