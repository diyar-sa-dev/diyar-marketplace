<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\Order;
use App\Services\Notifications\NotificationContextBuilder;
use App\Services\Notifications\NotificationIntent;
use App\Support\Notifications\NotificationUrlSupport;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class OrderCreated implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Order $order,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->order->loadMissing(['user', 'vendorOrders.items']);

        $builder = app(NotificationContextBuilder::class);
        $products = $builder->summarizeOrderItems($this->order);
        $detailLines = $builder->orderDetailLines($this->order);

        return new NotificationIntent(
            type: NotificationType::OrderCreated,
            recipients: array_filter([$this->order->user]),
            payload: [
                'order_number' => $this->order->order_number,
                'total' => (string) $this->order->grand_total,
                'products' => $products,
                'customer_name' => (string) ($this->order->user?->name ?? ''),
                'detail_lines' => $detailLines,
                'action_url' => NotificationUrlSupport::orderUrl((string) $this->order->id),
            ],
            entityType: 'order',
            entityId: $this->order->id,
            dedupeKey: "order.created:{$this->order->id}",
        );
    }
}
