<?php

namespace App\Services\Order;

use App\Enums\ShippingMethod;
use App\Events\Domain\OrderDelivered;
use App\Events\Domain\OrderShipped;
use App\Models\Shipment;
use App\Models\VendorOrder;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class VendorOrderFulfillmentService
{
    public function __construct(
        private readonly VendorOrderStateService $vendorOrderState,
        private readonly ShipmentStateService $shipmentState,
        private readonly OrderCancellationService $orderCancellation,
    ) {}

    public function accept(VendorOrder $vendorOrder): VendorOrder
    {
        return DB::transaction(function () use ($vendorOrder): VendorOrder {
            $locked = $this->lockVendorOrder($vendorOrder);
            $updated = $this->vendorOrderState->accept($locked);

            return $updated->fresh(['items', 'order', 'shipment']);
        });
    }

    public function markProcessing(VendorOrder $vendorOrder): VendorOrder
    {
        return DB::transaction(function () use ($vendorOrder): VendorOrder {
            $locked = $this->lockVendorOrder($vendorOrder);
            $updated = $this->vendorOrderState->markProcessing($locked);
            $this->shipmentState->markPrepared($this->requireShipment($updated));

            return $updated->fresh(['items', 'order', 'shipment']);
        });
    }

    public function markShipped(VendorOrder $vendorOrder, string $trackingNumber, ?string $carrier = null): VendorOrder
    {
        return DB::transaction(function () use ($vendorOrder, $trackingNumber, $carrier): VendorOrder {
            $locked = $this->lockVendorOrder($vendorOrder);

            if ($locked->shipping_method === ShippingMethod::Pickup->value && trim($trackingNumber) === '') {
                $trackingNumber = 'PICKUP';
            }

            $updated = $this->vendorOrderState->markShipped($locked);
            $this->shipmentState->markShipped(
                $this->requireShipment($updated),
                $trackingNumber,
                $carrier,
            );

            $fresh = $updated->fresh(['items', 'order', 'shipment', 'vendorAccount']);
            DB::afterCommit(fn () => event(new OrderShipped($fresh)));

            return $fresh;
        });
    }

    public function markDelivered(VendorOrder $vendorOrder): VendorOrder
    {
        return DB::transaction(function () use ($vendorOrder): VendorOrder {
            $locked = $this->lockVendorOrder($vendorOrder);
            $updated = $this->vendorOrderState->markDelivered($locked);
            $this->shipmentState->markDelivered($this->requireShipment($updated));

            $fresh = $updated->fresh(['items', 'order', 'shipment', 'vendorAccount']);
            DB::afterCommit(fn () => event(new OrderDelivered($fresh)));

            return $fresh;
        });
    }

    public function cancel(VendorOrder $vendorOrder): VendorOrder
    {
        return DB::transaction(function () use ($vendorOrder): VendorOrder {
            $locked = $this->lockVendorOrder($vendorOrder);
            $updated = $this->vendorOrderState->cancel($locked);
            $shipment = $updated->shipment;

            if ($shipment !== null && $shipment->status->value !== 'cancelled') {
                $this->shipmentState->markCancelled($shipment);
            }

            $this->orderCancellation->reconcileAfterVendorOrderCancelled($updated);

            return $updated->fresh(['items', 'order.payment', 'order.vendorOrders', 'shipment']);
        });
    }

    private function lockVendorOrder(VendorOrder $vendorOrder): VendorOrder
    {
        return VendorOrder::query()
            ->whereKey($vendorOrder->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function requireShipment(VendorOrder $vendorOrder): Shipment
    {
        $shipment = $vendorOrder->shipment;

        if ($shipment === null) {
            throw new InvalidArgumentException(__('diyar.shipment.missing'));
        }

        return $shipment;
    }
}
