<?php

namespace App\Services\Loyalty;

use App\Models\Order;

/**
 * Defines the single authoritative loyalty-eligible amount for an order.
 *
 * Rule: order.grand_total — the amount verified at payment finalization
 * (PaymentFinalizationService asserts payment.amount === order.grand_total).
 */
final class LoyaltyEligibleAmountService
{
    public function forOrder(Order $order): string
    {
        return number_format((float) $order->grand_total, 2, '.', '');
    }
}
