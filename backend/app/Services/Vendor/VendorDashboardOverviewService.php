<?php

namespace App\Services\Vendor;

use App\Enums\FinancePeriod;
use App\Enums\ProductPreorderStatus;
use App\Enums\ProductStatus;
use App\Enums\ReturnRequestStatus;
use App\Enums\VendorOrderStatus;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductInventory;
use App\Models\ProductPreorderRequest;
use App\Models\ReturnRequest;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use App\Services\Finance\DTO\VendorFinanceAnalyticsPoint;
use App\Services\Finance\VendorBalanceService;
use App\Services\Finance\VendorFinancePeriodResolver;
use App\Services\Finance\VendorFinanceReportingService;
use App\Services\Media\MediaUploadService;
use App\Services\StoreReview\StoreReviewService;
use Illuminate\Support\Facades\Cache;

final class VendorDashboardOverviewService
{
    public function __construct(
        private readonly VendorFinanceReportingService $financeReporting,
        private readonly VendorBalanceService $balances,
        private readonly VendorFinancePeriodResolver $periods,
        private readonly StoreReviewService $storeReviews,
    ) {}

    private function lowStockThreshold(): int
    {
        return (int) config('diyar.vendor.low_stock_threshold', 5);
    }

    /**
     * @return array<string, mixed>
     */
    public function overview(VendorAccount $vendorAccount): array
    {
        $ttl = (int) config('diyar.vendor.dashboard_cache_seconds', 90);
        $cacheKey = 'diyar:vendor:'.$vendorAccount->id.':dashboard:overview';

        return Cache::remember($cacheKey, $ttl, fn (): array => $this->buildOverview($vendorAccount));
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOverview(VendorAccount $vendorAccount): array
    {
        $currency = (string) config('diyar.finance.currency', 'SAR');
        $monthReport = $this->financeReporting->periodReport($vendorAccount, FinancePeriod::Month, $currency);
        $balance = $this->balances->summary($vendorAccount, $currency);

        $salesChart = $this->financeReporting->analytics($vendorAccount, FinancePeriod::Week, $currency);
        $storeReviewSummary = $this->storeReviews->ratingSummary($vendorAccount);
        $lowStockThreshold = $this->lowStockThreshold();

        return [
            'currency' => $currency,
            'period_sales' => $monthReport->grossSales,
            'available_balance' => $balance->availableBalance,
            'pending_escrow' => $balance->pendingEscrow,
            'store_reviews' => $storeReviewSummary,
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
            'preorders' => [
                'pending' => ProductPreorderRequest::query()
                    ->where('vendor_account_id', $vendorAccount->id)
                    ->where('status', ProductPreorderStatus::Pending)
                    ->count(),
            ],
            'products' => [
                'active' => Product::query()
                    ->where('vendor_account_id', $vendorAccount->id)
                    ->where('status', ProductStatus::Active->value)
                    ->count(),
                'low_stock' => $this->countLowStockProducts($vendorAccount->id, $lowStockThreshold),
            ],
            'sales_chart' => array_map(
                static fn (VendorFinanceAnalyticsPoint $point) => [
                    'label' => $point->label,
                    'sales' => $point->grossSales,
                ],
                $salesChart,
            ),
            'recent_orders' => $this->recentOrders($vendorAccount->id),
            'low_stock_products' => $this->lowStockProducts($vendorAccount->id, $lowStockThreshold),
            'top_selling_products' => $this->topSellingProducts($vendorAccount->id),
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

    private function countLowStockProducts(string $vendorAccountId, int $threshold): int
    {
        return ProductInventory::query()
            ->whereHas('product', fn ($query) => $query
                ->where('vendor_account_id', $vendorAccountId)
                ->where('status', ProductStatus::Active->value))
            ->where('available_quantity', '<=', $threshold)
            ->count();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function recentOrders(string $vendorAccountId): array
    {
        return VendorOrder::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->with(['order:id,order_number', 'items:id,vendor_order_id,product_name'])
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
    private function lowStockProducts(string $vendorAccountId, int $threshold): array
    {
        return ProductInventory::query()
            ->with(['product.images' => fn ($query) => $query
                ->orderBy('sort_order')
                ->limit(1)
                ->with('mediaFile:id,path')])
            ->whereHas('product', fn ($query) => $query
                ->where('vendor_account_id', $vendorAccountId)
                ->where('status', ProductStatus::Active->value))
            ->where('available_quantity', '<=', $threshold)
            ->orderBy('available_quantity')
            ->limit(5)
            ->get()
            ->map(function (ProductInventory $inventory) {
                $product = $inventory->product;

                return [
                    'id' => $product?->id,
                    'name' => $product?->name,
                    'image_url' => $this->productImageUrl($product),
                    'available_quantity' => $inventory->available_quantity,
                    'stock_quantity' => $inventory->stock_quantity,
                    'status' => $inventory->available_quantity <= 0 ? 'out_of_stock' : 'low_stock',
                ];
            })
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function topSellingProducts(string $vendorAccountId): array
    {
        $rows = OrderItem::query()
            ->selectRaw('order_items.product_id, MAX(order_items.product_name) as product_name, SUM(order_items.quantity) as orders_count, SUM(order_items.line_subtotal) as revenue, MAX(product_inventory.available_quantity) as available_quantity')
            ->join('vendor_orders', 'vendor_orders.id', '=', 'order_items.vendor_order_id')
            ->leftJoin('product_inventory', 'product_inventory.product_id', '=', 'order_items.product_id')
            ->where('vendor_orders.vendor_account_id', $vendorAccountId)
            ->where('vendor_orders.status', VendorOrderStatus::Delivered->value)
            ->groupBy('order_items.product_id')
            ->orderByDesc('orders_count')
            ->limit(5)
            ->get();

        $products = Product::query()
            ->with(['images' => fn ($query) => $query
                ->orderBy('sort_order')
                ->limit(1)
                ->with('mediaFile:id,path')])
            ->whereIn('id', $rows->pluck('product_id')->filter()->unique())
            ->get()
            ->keyBy('id');

        return $rows
            ->map(function ($row) use ($products) {
                $product = $products->get($row->product_id);

                return [
                    'id' => $row->product_id,
                    'name' => $row->product_name,
                    'image_url' => $this->productImageUrl($product),
                    'orders_count' => (int) $row->orders_count,
                    'available_quantity' => (int) ($row->available_quantity ?? 0),
                    'revenue' => number_format((float) $row->revenue, 2, '.', ''),
                ];
            })
            ->all();
    }

    private function productImageUrl(?Product $product): ?string
    {
        if ($product === null) {
            return null;
        }

        $product->loadMissing(['images.mediaFile']);
        $firstImage = $product->images->first();

        if ($firstImage === null || $firstImage->mediaFile === null) {
            return null;
        }

        return app(MediaUploadService::class)->url($firstImage->mediaFile->path);
    }
}
