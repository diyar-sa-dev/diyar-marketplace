<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\PayoutStatus;
use App\Http\Controllers\Controller;
use App\Models\AffiliateCommission;
use App\Models\AffiliatePayout;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorPayout;
use App\Support\Api\ApiResponse;
use App\Support\Database\SqlDialect;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class AdminReportController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $from = $request->date('from') ?? Carbon::now()->subDays(30);
        $to = $request->date('to') ?? Carbon::now();

        $ordersQuery = Order::query()->whereBetween('created_at', [$from, $to]);
        $paymentsQuery = Payment::query()->whereBetween('created_at', [$from, $to]);

        return ApiResponse::success(data: [
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'totals' => [
                'users' => User::query()->count(),
                'vendors' => VendorAccount::query()->count(),
                'products' => Product::query()->count(),
                'orders' => (clone $ordersQuery)->count(),
                'order_revenue' => number_format((float) (clone $ordersQuery)->sum('grand_total'), 2, '.', ''),
                'payments' => (clone $paymentsQuery)->count(),
                'payment_volume' => number_format((float) (clone $paymentsQuery)->whereNotNull('paid_at')->sum('amount'), 2, '.', ''),
                'pending_vendor_payouts' => VendorPayout::query()->where('status', PayoutStatus::Pending)->count(),
                'pending_affiliate_payouts' => AffiliatePayout::query()->where('status', PayoutStatus::Pending)->count(),
                'affiliate_commissions' => AffiliateCommission::query()->whereBetween('created_at', [$from, $to])->count(),
            ],
            'orders_by_day' => $this->ordersByDay($from, $to),
        ]);
    }

    /** @return list<array<string, mixed>> */
    private function ordersByDay(Carbon $from, Carbon $to): array
    {
        $dayExpr = SqlDialect::dayPeriodExpression('created_at');

        return DB::table('orders')
            ->selectRaw("{$dayExpr} as day, COUNT(*) as count, SUM(grand_total) as revenue")
            ->whereBetween('created_at', [$from, $to])
            ->groupByRaw($dayExpr)
            ->orderBy('day')
            ->get()
            ->map(fn ($row) => [
                'day' => $row->day,
                'count' => (int) $row->count,
                'revenue' => number_format((float) $row->revenue, 2, '.', ''),
            ])
            ->all();
    }
}
