<?php

namespace App\Services\Order;

use App\Enums\VendorOrderStatus;
use App\Models\VendorOrder;
use App\Services\Finance\EscrowReleaseService;
use InvalidArgumentException;

final class VendorOrderStateService
{
    public function __construct(
        private readonly EscrowReleaseService $escrowRelease,
    ) {}

    /** @var array<string, list<VendorOrderStatus>> */
    private const TRANSITIONS = [
        'pending' => [VendorOrderStatus::Accepted, VendorOrderStatus::Cancelled],
        'accepted' => [VendorOrderStatus::Processing, VendorOrderStatus::Cancelled],
        'processing' => [VendorOrderStatus::Shipped, VendorOrderStatus::Cancelled],
        'shipped' => [VendorOrderStatus::Delivered],
    ];

    public function accept(VendorOrder $vendorOrder): VendorOrder
    {
        if ($vendorOrder->status === VendorOrderStatus::Accepted) {
            return $vendorOrder;
        }

        $this->assertTransition($vendorOrder->status, VendorOrderStatus::Accepted);
        $vendorOrder->update(['status' => VendorOrderStatus::Accepted]);

        return $vendorOrder->fresh();
    }

    public function markProcessing(VendorOrder $vendorOrder): VendorOrder
    {
        if ($vendorOrder->status === VendorOrderStatus::Processing) {
            return $vendorOrder;
        }

        $this->assertTransition($vendorOrder->status, VendorOrderStatus::Processing);
        $vendorOrder->update(['status' => VendorOrderStatus::Processing]);

        return $vendorOrder->fresh();
    }

    public function markShipped(VendorOrder $vendorOrder): VendorOrder
    {
        if ($vendorOrder->status === VendorOrderStatus::Shipped) {
            return $vendorOrder;
        }

        $this->assertTransition($vendorOrder->status, VendorOrderStatus::Shipped);
        $vendorOrder->update(['status' => VendorOrderStatus::Shipped]);

        return $vendorOrder->fresh();
    }

    public function markDelivered(VendorOrder $vendorOrder): VendorOrder
    {
        if ($vendorOrder->status === VendorOrderStatus::Delivered) {
            return $vendorOrder;
        }

        $this->assertTransition($vendorOrder->status, VendorOrderStatus::Delivered);
        $vendorOrder->update(['status' => VendorOrderStatus::Delivered]);

        $this->escrowRelease->releaseForVendorOrder($vendorOrder->fresh());

        return $vendorOrder->fresh();
    }

    public function cancel(VendorOrder $vendorOrder): VendorOrder
    {
        if ($vendorOrder->status === VendorOrderStatus::Cancelled) {
            return $vendorOrder;
        }

        $this->assertTransition($vendorOrder->status, VendorOrderStatus::Cancelled);
        $vendorOrder->update(['status' => VendorOrderStatus::Cancelled]);

        return $vendorOrder->fresh();
    }

    private function assertTransition(VendorOrderStatus $from, VendorOrderStatus $to): void
    {
        $allowed = self::TRANSITIONS[$from->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw new InvalidArgumentException(__('diyar.order.invalid_status_transition'));
        }
    }
}
