<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\Product;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ProductStockLow implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Product $product,
        public readonly int $quantity,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->product->loadMissing('vendorAccount.user');

        return new NotificationIntent(
            type: NotificationType::ProductStockLow,
            recipients: array_filter([$this->product->vendorAccount?->user]),
            payload: [
                'product_name' => (string) $this->product->name,
                'quantity' => (string) $this->quantity,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/vendor/products',
            ],
            entityType: 'product',
            entityId: $this->product->id,
            dedupeKey: "product.stock_low:{$this->product->id}:{$this->quantity}",
        );
    }
}
