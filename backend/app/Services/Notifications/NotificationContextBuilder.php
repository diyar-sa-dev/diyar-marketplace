<?php

namespace App\Services\Notifications;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductReview;
use App\Models\ServiceBooking;
use App\Models\User;
use App\Models\VendorOrder;

final class NotificationContextBuilder
{
    /**
     * @return list<array{label: string, value: string}>
     */
    public function orderDetailLines(Order $order): array
    {
        $order->loadMissing(['user', 'vendorOrders.items']);

        $lines = [
            ['label' => 'order_number', 'value' => (string) $order->order_number],
            ['label' => 'total', 'value' => (string) $order->grand_total.' SAR'],
        ];

        $products = $this->summarizeOrderItems($order);
        if ($products !== '') {
            $lines[] = ['label' => 'products', 'value' => $products];
        }

        if ($order->user?->name) {
            $lines[] = ['label' => 'customer', 'value' => (string) $order->user->name];
        }

        return $lines;
    }

    /**
     * @return list<array{label: string, value: string}>
     */
    public function vendorOrderDetailLines(VendorOrder $vendorOrder): array
    {
        $vendorOrder->loadMissing(['order.user', 'vendorAccount', 'items']);

        $lines = [
            ['label' => 'order_number', 'value' => (string) ($vendorOrder->order?->order_number ?? '')],
            ['label' => 'store', 'value' => (string) ($vendorOrder->vendorAccount?->business_name ?? '')],
            ['label' => 'total', 'value' => (string) $vendorOrder->vendor_total.' SAR'],
        ];

        $products = $this->summarizeVendorOrderItems($vendorOrder);
        if ($products !== '') {
            $lines[] = ['label' => 'products', 'value' => $products];
        }

        if ($vendorOrder->order?->user?->name) {
            $lines[] = ['label' => 'customer', 'value' => (string) $vendorOrder->order->user->name];
        }

        return $lines;
    }

    /**
     * @return list<array{label: string, value: string}>
     */
    public function bookingDetailLines(ServiceBooking $booking, ?User $recipient = null): array
    {
        $booking->loadMissing(['user', 'providerAccount.user']);

        $lines = [
            ['label' => 'reference', 'value' => (string) $booking->reference],
            ['label' => 'service', 'value' => (string) $booking->service_title_snapshot],
        ];

        if ($booking->user?->name) {
            $lines[] = ['label' => 'customer', 'value' => (string) $booking->user->name];
        }

        if ($booking->providerAccount?->business_name) {
            $lines[] = ['label' => 'provider', 'value' => (string) $booking->providerAccount->business_name];
        }

        if ($recipient !== null && $booking->user_id === $recipient->id) {
            $lines = array_values(array_filter(
                $lines,
                fn (array $line) => $line['label'] !== 'customer',
            ));
        }

        if ($recipient !== null && $booking->providerAccount?->user_id === $recipient->id) {
            $lines = array_values(array_filter(
                $lines,
                fn (array $line) => $line['label'] !== 'provider',
            ));
        }

        return $lines;
    }

    /**
     * @return list<array{label: string, value: string}>
     */
    public function reviewDetailLines(ProductReview $review): array
    {
        $review->loadMissing(['user', 'product.vendorAccount']);

        $lines = [
            ['label' => 'product', 'value' => (string) ($review->product?->name ?? '')],
            ['label' => 'rating', 'value' => (string) $review->rating],
        ];

        if ($review->product?->vendorAccount?->business_name) {
            $lines[] = ['label' => 'store', 'value' => (string) $review->product->vendorAccount->business_name];
        }

        if ($review->user?->name) {
            $lines[] = ['label' => 'reviewer', 'value' => (string) $review->user->name];
        }

        return $lines;
    }

    public function summarizeOrderItems(Order $order): string
    {
        $items = $order->vendorOrders->flatMap(fn (VendorOrder $vendorOrder) => $vendorOrder->items);

        return $this->formatItems($items);
    }

    public function summarizeVendorOrderItems(VendorOrder $vendorOrder): string
    {
        return $this->formatItems($vendorOrder->items);
    }

    /**
     * @param  iterable<OrderItem>  $items
     */
    private function formatItems(iterable $items): string
    {
        $parts = [];

        foreach ($items as $item) {
            $name = trim((string) ($item->product_name ?? ''));
            if ($name === '') {
                continue;
            }

            $qty = max(1, (int) $item->quantity);
            $parts[] = $qty > 1 ? "{$name} ×{$qty}" : $name;
        }

        return implode('، ', array_slice($parts, 0, 4)).(count($parts) > 4 ? '…' : '');
    }
}
