<?php

namespace App\Services\Returns;

use App\Enums\ReturnRequestStatus;
use App\Models\OrderItem;
use App\Models\ReturnItem;

final class ReturnedQuantityService
{
    public function remainingQuantity(OrderItem $orderItem): int
    {
        $returned = (int) ReturnItem::query()
            ->where('order_item_id', $orderItem->id)
            ->whereHas('returnRequest', fn ($query) => $query->whereNotIn('status', [
                ReturnRequestStatus::Rejected->value,
                ReturnRequestStatus::Cancelled->value,
            ]))
            ->sum('quantity');

        return max(0, (int) $orderItem->quantity - $returned);
    }

    public function totalRefundedForOrderItem(OrderItem $orderItem): int
    {
        return (int) ReturnItem::query()
            ->where('order_item_id', $orderItem->id)
            ->whereHas('returnRequest', fn ($query) => $query->where('status', ReturnRequestStatus::Refunded->value))
            ->sum('quantity');
    }
}
