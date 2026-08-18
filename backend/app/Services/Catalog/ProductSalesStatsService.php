<?php

namespace App\Services\Catalog;

use App\Enums\ReturnRequestStatus;
use App\Enums\VendorOrderStatus;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ReturnItem;

final class ProductSalesStatsService
{
    /**
     * @return array{orders_count: int, total_revenue: string, return_rate: float}
     */
    public function forProduct(Product $product): array
    {
        $productId = $product->id;
        $vendorAccountId = $product->vendor_account_id;

        $baseQuery = OrderItem::query()
            ->join('vendor_orders', 'order_items.vendor_order_id', '=', 'vendor_orders.id')
            ->where('order_items.product_id', $productId)
            ->where('vendor_orders.vendor_account_id', $vendorAccountId)
            ->where('vendor_orders.status', '!=', VendorOrderStatus::Cancelled->value);

        $ordersCount = (int) (clone $baseQuery)
            ->distinct()
            ->count('vendor_orders.id');

        $unitsSold = (int) (clone $baseQuery)->sum('order_items.quantity');
        $totalRevenue = (float) (clone $baseQuery)->sum('order_items.line_subtotal');

        $returnedUnits = (int) ReturnItem::query()
            ->join('order_items', 'return_items.order_item_id', '=', 'order_items.id')
            ->join('return_requests', 'return_items.return_request_id', '=', 'return_requests.id')
            ->join('vendor_orders', 'return_requests.vendor_order_id', '=', 'vendor_orders.id')
            ->where('order_items.product_id', $productId)
            ->where('vendor_orders.vendor_account_id', $vendorAccountId)
            ->where('return_requests.status', ReturnRequestStatus::Refunded->value)
            ->sum('return_items.quantity');

        $returnRate = $unitsSold > 0
            ? round(($returnedUnits / $unitsSold) * 100, 1)
            : 0.0;

        return [
            'orders_count' => $ordersCount,
            'total_revenue' => number_format($totalRevenue, 2, '.', ''),
            'return_rate' => $returnRate,
        ];
    }
}
