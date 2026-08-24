<?php

namespace App\Services\Admin;

use App\Enums\PayoutStatus;
use App\Enums\ServiceBookingStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\AffiliatePayout;
use App\Models\Order;
use App\Models\ProviderAccount;
use App\Models\ServiceBooking;
use App\Models\ServiceRequest;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorPayout;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

final class AdminDashboardService
{
    /** @return array<string, mixed> */
    public function metrics(): array
    {
        $ttl = (int) config('diyar.admin.dashboard_cache_seconds', 60);

        return Cache::remember('diyar:admin:dashboard:metrics', $ttl, fn (): array => $this->buildMetrics());
    }

    /** @return array<string, mixed> */
    private function buildMetrics(): array
    {
        $today = Carbon::today();
        $tomorrow = $today->copy()->addDay();

        return [
            'orders_today' => Order::query()
                ->where('created_at', '>=', $today)
                ->where('created_at', '<', $tomorrow)
                ->count(),
            'pending_vendor_payouts' => VendorPayout::query()->where('status', PayoutStatus::Pending)->count(),
            'pending_affiliate_payouts' => AffiliatePayout::query()->where('status', PayoutStatus::Pending)->count(),
            'active_users' => User::query()->where('status', 'active')->count(),
            'vendors' => VendorAccount::query()->count(),
            'providers' => ProviderAccount::query()->count(),
            'service_requests_open' => ServiceRequest::query()
                ->whereIn('status', [
                    ServiceRequestStatus::Pending,
                    ServiceRequestStatus::OffersReceived,
                    ServiceRequestStatus::OfferAccepted,
                    ServiceRequestStatus::InProgress,
                ])
                ->count(),
            'bookings_active' => ServiceBooking::query()
                ->whereIn('status', [
                    ServiceBookingStatus::PendingPayment,
                    ServiceBookingStatus::Confirmed,
                    ServiceBookingStatus::InProgress,
                ])
                ->count(),
            'recent_activity' => $this->recentActivity(),
        ];
    }

    /** @return list<array<string, mixed>> */
    private function recentActivity(): array
    {
        return DB::table('admin_audit_logs')
            ->orderByDesc('created_at')
            ->limit(8)
            ->get(['action', 'resource_type', 'resource_id', 'created_at'])
            ->map(fn ($row) => [
                'action' => $row->action,
                'resource_type' => $row->resource_type,
                'resource_id' => $row->resource_id,
                'created_at' => $row->created_at,
            ])
            ->all();
    }
}
