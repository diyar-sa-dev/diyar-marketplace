<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentAttempt;
use App\Models\PaymentVendorAllocation;
use App\Services\Finance\CommissionResolver;

final class PaymentAllocationSnapshotService
{
    public function __construct(
        private readonly CommissionResolver $commissionResolver,
    ) {}

    public function snapshotForPayment(Payment $payment, ?PaymentAttempt $attempt = null): void
    {
        $order = Order::query()
            ->with(['vendorOrders.vendorAccount', 'vendorOrders.items.product'])
            ->findOrFail($payment->order_id);

        foreach ($order->vendorOrders as $vendorOrder) {
            $existing = PaymentVendorAllocation::query()
                ->where('payment_id', $payment->id)
                ->where('vendor_order_id', $vendorOrder->id)
                ->first();

            if ($existing !== null) {
                continue;
            }

            $this->createAllocationSnapshot($payment, $vendorOrder, $attempt);
        }
    }

    /**
     * Creates allocation snapshots only when missing — never overwrites frozen snapshots.
     */
    public function ensureSnapshotForPayment(Payment $payment, ?PaymentAttempt $attempt = null): void
    {
        $order = Order::query()
            ->with(['vendorOrders.vendorAccount', 'vendorOrders.items.product'])
            ->findOrFail($payment->order_id);

        foreach ($order->vendorOrders as $vendorOrder) {
            $exists = PaymentVendorAllocation::query()
                ->where('payment_id', $payment->id)
                ->where('vendor_order_id', $vendorOrder->id)
                ->exists();

            if (! $exists) {
                $this->createAllocationSnapshot($payment, $vendorOrder, $attempt);
            }
        }
    }

    private function createAllocationSnapshot(Payment $payment, $vendorOrder, ?PaymentAttempt $attempt): void
    {
        $vendorName = $vendorOrder->vendorAccount->business_name ?? '—';
        $commissionResolution = $this->commissionResolver->resolveForVendorOrder($vendorOrder);
        $commission = $commissionResolution->commissionAmount;
        $gross = number_format((float) $vendorOrder->vendor_total, 2, '.', '');
        $payable = bcsub($gross, $commission, 2);

        PaymentVendorAllocation::query()->create([
            'payment_id' => $payment->id,
            'payment_attempt_id' => $attempt?->id,
            'vendor_order_id' => $vendorOrder->id,
            'vendor_account_id' => $vendorOrder->vendor_account_id,
            'vendor_name' => $vendorName,
            'vendor_subtotal' => $vendorOrder->subtotal,
            'shipping_cost' => $vendorOrder->shipping_cost,
            'assembly_cost' => $vendorOrder->assembly_cost,
            'discount_amount' => $vendorOrder->discount_amount,
            'vat_amount' => $vendorOrder->vat_amount,
            'vendor_gross_total' => $gross,
            'platform_commission_amount' => $commission,
            'vendor_payable_amount' => $payable,
            'currency' => $payment->currency,
        ]);
    }

    public function assertAllocationsMatchPayment(Payment $payment): void
    {
        $allocated = PaymentVendorAllocation::query()
            ->where('payment_id', $payment->id)
            ->sum('vendor_gross_total');

        $paymentAmount = number_format((float) $payment->amount, 2, '.', '');

        if (bccomp((string) $allocated, $paymentAmount, 2) !== 0) {
            throw new \InvalidArgumentException(__('diyar.payment.allocation_mismatch'));
        }
    }
}
