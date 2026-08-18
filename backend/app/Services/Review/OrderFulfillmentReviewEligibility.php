<?php

namespace App\Services\Review;

use App\Enums\PaymentStatus;
use App\Enums\VendorOrderStatus;
use App\Models\Order;
use App\Models\VendorOrder;

final class OrderFulfillmentReviewEligibility
{
    public function isVendorOrderEligible(VendorOrder $vendorOrder, Order $order): bool
    {
        if ($vendorOrder->status !== VendorOrderStatus::Delivered) {
            return false;
        }

        $paymentStatus = $order->payment?->status;

        return in_array($paymentStatus, [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded], true);
    }
}
