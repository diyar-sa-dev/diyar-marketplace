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
        $amount = $order->grand_total;

        if ($amount === null || $amount === '') {
            return '0.00';
        }

        return bcadd((string) $amount, '0', 2);
    }
}
