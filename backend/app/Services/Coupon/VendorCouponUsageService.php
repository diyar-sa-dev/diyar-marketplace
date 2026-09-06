<?php

namespace App\Services\Coupon;

use App\Models\Order;
use App\Models\VendorCoupon;
use App\Models\VendorCouponUsage;
use App\Models\VendorOrder;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class VendorCouponUsageService
{
    public function recordForPaidOrder(Order $order): void
    {
        $order->loadMissing(['vendorOrders']);

        foreach ($order->vendorOrders as $vendorOrder) {
            if ($vendorOrder->vendor_coupon_id === null) {
                continue;
            }

            $this->recordSingleUsage($order, $vendorOrder);
        }
    }

    private function recordSingleUsage(Order $order, VendorOrder $vendorOrder): void
    {
        DB::transaction(function () use ($order, $vendorOrder) {
            $coupon = VendorCoupon::query()
                ->whereKey($vendorOrder->vendor_coupon_id)
                ->lockForUpdate()
                ->first();

            if ($coupon === null) {
                return;
            }

            $order->loadMissing('user');
            try {
                app(VendorCouponValidationService::class)->revalidateBeforeUsage($coupon, $order->user);
            } catch (\InvalidArgumentException) {
                Log::warning('coupon_redemption_conflict', [
                    'order_id' => $order->id,
                    'vendor_coupon_id' => $coupon->id,
                ]);

                return;
            }

            if ($coupon->usage_limit !== null && $coupon->used_count >= $coupon->usage_limit) {
                return;
            }

            try {
                VendorCouponUsage::query()->create([
                    'vendor_coupon_id' => $coupon->id,
                    'user_id' => $order->user_id,
                    'order_id' => $order->id,
                    'vendor_order_id' => $vendorOrder->id,
                    'discount_amount' => $vendorOrder->discount_amount,
                    'coupon_code' => $vendorOrder->coupon_code ?? $coupon->code,
                    'coupon_percent' => $vendorOrder->coupon_percent_snapshot ?? $coupon->value,
                    'used_at' => now(),
                ]);
            } catch (QueryException $exception) {
                if ($this->isDuplicateUsage($exception)) {
                    return;
                }

                throw $exception;
            }

            $coupon->increment('used_count');
        });
    }

    private function isDuplicateUsage(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
