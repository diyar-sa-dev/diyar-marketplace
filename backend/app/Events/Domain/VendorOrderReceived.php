<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\VendorOrder;
use App\Services\Notifications\NotificationContextBuilder;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class VendorOrderReceived implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly VendorOrder $vendorOrder,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->vendorOrder->loadMissing(['order.user', 'vendorAccount.user', 'items']);

        $builder = app(NotificationContextBuilder::class);
        $products = $builder->summarizeVendorOrderItems($this->vendorOrder);

        return new NotificationIntent(
            type: NotificationType::VendorOrderReceived,
            recipients: array_filter([$this->vendorOrder->vendorAccount?->user]),
            payload: [
                'order_number' => (string) ($this->vendorOrder->order?->order_number ?? ''),
                'total' => (string) $this->vendorOrder->vendor_total,
                'products' => $products,
                'customer_name' => (string) ($this->vendorOrder->order?->user?->name ?? ''),
                'store_name' => (string) ($this->vendorOrder->vendorAccount?->business_name ?? ''),
                'detail_lines' => $builder->vendorOrderDetailLines($this->vendorOrder),
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/vendor/orders',
            ],
            entityType: 'vendor_order',
            entityId: $this->vendorOrder->id,
            dedupeKey: "order.vendor_received:{$this->vendorOrder->id}",
        );
    }
}
