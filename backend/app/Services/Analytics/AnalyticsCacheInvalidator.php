<?php

namespace App\Services\Analytics;

use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ServiceBooking;

final class AnalyticsCacheInvalidator
{
    public function __construct(
        private readonly AnalyticsCache $cache,
    ) {}

    public function invalidatePlatform(): void
    {
        $this->cache->invalidateScope('admin', 'platform');
    }

    public function invalidateVendor(?string $vendorAccountId): void
    {
        if ($vendorAccountId === null || $vendorAccountId === '') {
            return;
        }

        $this->cache->invalidateScope('vendor', $vendorAccountId);
    }

    public function invalidateProvider(?string $providerAccountId): void
    {
        if ($providerAccountId === null || $providerAccountId === '') {
            return;
        }

        $this->cache->invalidateScope('provider', $providerAccountId);
    }

    public function invalidateForPayment(Payment $payment): void
    {
        $this->invalidatePlatform();

        $payment->loadMissing('order.vendorOrders');

        foreach ($payment->order?->vendorOrders ?? [] as $vendorOrder) {
            $this->invalidateVendor($vendorOrder->vendor_account_id);
        }
    }

    public function invalidateForOrder(Order $order): void
    {
        $this->invalidatePlatform();

        $order->loadMissing('vendorOrders');
        foreach ($order->vendorOrders as $vendorOrder) {
            $this->invalidateVendor($vendorOrder->vendor_account_id);
        }
    }

    public function invalidateForProduct(Product $product): void
    {
        $this->invalidatePlatform();
        $this->invalidateVendor($product->vendor_account_id);
    }

    public function invalidateForBooking(ServiceBooking $booking): void
    {
        $this->invalidatePlatform();
        $this->invalidateProvider($booking->provider_account_id);
    }
}
