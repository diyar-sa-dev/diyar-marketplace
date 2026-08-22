<?php

namespace App\Services\Admin;

use App\Models\Order;
use App\Models\User;
use App\Services\Order\OrderCancellationService;
use Illuminate\Support\Facades\DB;

final class AdminOrderService
{
    public function __construct(
        private readonly OrderCancellationService $cancellations,
        private readonly AdminAuditService $audit,
    ) {}

    public function cancelPending(Order $order, User $actor, ?string $reason = null): Order
    {
        return DB::transaction(function () use ($order, $actor, $reason): Order {
            $before = ['status' => $order->status->value];
            $updated = $this->cancellations->cancel($order);

            $this->audit->record(
                actor: $actor,
                action: 'order.cancel',
                resource: $updated,
                before: $before,
                after: ['status' => $updated->status->value],
                reason: $reason,
            );

            return $updated->fresh(['user', 'vendorOrders', 'payment']);
        });
    }
}
