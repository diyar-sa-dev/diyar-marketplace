<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\VendorOrder;
use App\Services\Notifications\NotificationContextBuilder;
use App\Services\Notifications\NotificationIntent;
use App\Support\Notifications\NotificationUrlSupport;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class OrderDelivered implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly VendorOrder $vendorOrder,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->vendorOrder->loadMissing(['order.user', 'vendorAccount', 'items']);

        $builder = app(NotificationContextBuilder::class);

        return new NotificationIntent(
            type: NotificationType::OrderDelivered,
            recipients: array_filter([$this->vendorOrder->order?->user]),
            payload: [
                'order_number' => $this->vendorOrder->order?->order_number,
                'vendor_name' => $this->vendorOrder->vendorAccount?->business_name,
                'store_name' => $this->vendorOrder->vendorAccount?->business_name,
                'products' => $builder->summarizeVendorOrderItems($this->vendorOrder),
                'detail_lines' => $builder->vendorOrderDetailLines($this->vendorOrder),
                'action_url' => NotificationUrlSupport::orderUrl((string) $this->vendorOrder->order_id),
            ],
            entityType: 'vendor_order',
            entityId: $this->vendorOrder->id,
            dedupeKey: "order.delivered:{$this->vendorOrder->id}",
        );
    }
}
