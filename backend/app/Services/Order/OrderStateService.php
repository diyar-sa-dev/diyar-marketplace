<?php

namespace App\Services\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use InvalidArgumentException;

final class OrderStateService
{
    /** @var array<string, list<OrderStatus>> */
    private const TRANSITIONS = [
        'pending' => [OrderStatus::Confirmed, OrderStatus::Cancelled],
        'confirmed' => [OrderStatus::Processing, OrderStatus::Cancelled],
        'processing' => [OrderStatus::Completed, OrderStatus::Cancelled],
    ];

    public function cancel(Order $order): Order
    {
        $this->assertTransition($order->status, OrderStatus::Cancelled);
        $order->update(['status' => OrderStatus::Cancelled]);

        return $order->fresh();
    }

    public function confirm(Order $order): Order
    {
        $this->assertTransition($order->status, OrderStatus::Confirmed);
        $order->update(['status' => OrderStatus::Confirmed]);

        return $order->fresh();
    }

    private function assertTransition(OrderStatus $from, OrderStatus $to): void
    {
        $allowed = self::TRANSITIONS[$from->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw new InvalidArgumentException(__('diyar.order.invalid_status_transition'));
        }
    }
}
