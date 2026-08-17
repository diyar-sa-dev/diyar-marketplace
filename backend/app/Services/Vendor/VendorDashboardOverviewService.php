<?php

namespace App\Services\Vendor;

use App\Enums\FinancePeriod;
use App\Enums\ProductStatus;
use App\Enums\ReturnRequestStatus;
use App\Enums\VendorOrderStatus;
use App\Models\Product;
use App\Models\ProductInventory;
use App\Models\ReturnRequest;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Services\Finance\DTO\VendorFinanceAnalyticsPoint;
use App\Services\Finance\VendorBalanceService;
use App\Services\Finance\VendorFinancePeriodResolver;
use App\Services\Finance\VendorFinanceReportingService;

final class VendorDashboardOverviewService
{
    private const LOW_STOCK_THRESHOLD = 5;

    public function __construct(
        private readonly VendorFinanceReportingService $financeReporting,
        private readonly VendorBalanceService $balances,
        private readonly VendorFinancePeriodResolver $periods,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function overview(VendorAccount $vendorAccount): array
    {
        $currency = (string) config('diyar.finance.currency', 'SAR');
        $monthReport = $this->financeReporting->periodReport($vendorAccount, FinancePeriod::Month, $currency);
        $balance = $this->balances->summary($vendorAccount, $currency);

        $weekWindow = $this->periods->resolve(FinancePeriod::Week);
        $salesChart = $this->financeReporting->analytics($vendorAccount, FinancePeriod::Week, $currency);

        return [
            'currency' => $currency,
            'period_sales' => $monthReport->grossSales,
            'available_balance' => $balance->availableBalance,
            'pending_escrow' => $balance->pendingEscrow,
            'orders' => [
                'pending' => $this->countOrdersByStatuses($vendorAccount->id, [
                    VendorOrderStatus::Pending,
                    VendorOrderStatus::Accepted,
                    VendorOrderStatus::Processing,
                    VendorOrderStatus::Shipped,
                ]),
                'completed' => $this->countOrdersByStatuses($vendorAccount->id, [VendorOrderStatus::Delivered]),
                'cancelled' => $this->countOrdersByStatuses($vendorAccount->id, [VendorOrderStatus::Cancelled]),
            ],
            'returns' => [
                'open' => ReturnRequest::query()
                    ->whereHas('vendorOrder', fn ($query) => $query
                        ->where('vendor_account_id', $vendorAccount->id))
                    ->whereNotIn('status', [
                        ReturnRequestStatus::Refunded->value,
                        ReturnRequestStatus::Rejected->value,
                        ReturnRequestStatus::Cancelled->value,
                    ])
                    ->count(),
            ],
            'products' => [
                'active' => Product::query()
                    ->where('vendor_account_id', $vendorAccount->id)
                    ->where('status', ProductStatus::Active->value)
                    ->count(),
                'low_stock' => $this->countLowStockProducts($vendorAccount->id),
            ],
            'sales_chart' => array_map(
                static fn (VendorFinanceAnalyticsPoint $point) => [
                    'label' => $point->label,
                    'sales' => $point->grossSales,
                ],
                $salesChart,
            ),
            'recent_orders' => $this->recentOrders($vendorAccount->id),
            'low_stock_products' => $this->lowStockProducts($vendorAccount->id),
        ];
    }

    /**
     * @param  list<VendorOrderStatus>  $statuses
     */
    private function countOrdersByStatuses(string $vendorAccountId, array $statuses): int
    {
        return VendorOrder::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->whereIn('status', array_map(static fn (VendorOrderStatus $status) => $status->value, $statuses))
            ->count();
    }

    private function countLowStockProducts(string $vendorAccountId): int
    {
        return ProductInventory::query()
            ->whereHas('product', fn ($query) => $query
                ->where('vendor_account_id', $vendorAccountId)
                ->where('status', ProductStatus::Active->value))
            ->where('available_quantity', '<=', self::LOW_STOCK_THRESHOLD)
            ->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentOrders(string $vendorAccountId): array
    {
        return VendorOrder::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->with(['order', 'items.product.images.mediaFile'])
            ->latest()
            ->limit(5)
            ->get()
            ->map(static function (VendorOrder $vendorOrder) {
                $firstItem = $vendorOrder->items->first();
                $productName = $firstItem?->product_name ?? $firstItem?->product?->name;

                return [
                    'id' => $vendorOrder->id,
                    'order_number' => $vendorOrder->order?->order_number,
                    'status' => $vendorOrder->status->value,
                    'vendor_total' => number_format((float) $vendorOrder->vendor_total, 2, '.', ''),
                    'product_name' => $productName,
                    'created_at' => $vendorOrder->created_at?->toIso8601String(),
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function lowStockProducts(string $vendorAccountId): array
    {
        return ProductInventory::query()
            ->with(['product.images.mediaFile'])
            ->whereHas('product', fn ($query) => $query
                ->where('vendor_account_id', $vendorAccountId)
                ->where('status', ProductStatus::Active->value))
            ->where('available_quantity', '<=', self::LOW_STOCK_THRESHOLD)
            ->orderBy('available_quantity')
            ->limit(5)
            ->get()
            ->map(static function (ProductInventory $inventory) {
                $product = $inventory->product;

                return [
                    'id' => $product?->id,
                    'name' => $product?->name,
                    'available_quantity' => $inventory->available_quantity,
                    'stock_quantity' => $inventory->stock_quantity,
                    'status' => $inventory->available_quantity <= 0 ? 'out_of_stock' : 'low_stock',
                ];
            })
            ->all();
    }
}
