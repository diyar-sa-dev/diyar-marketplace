<?php

namespace App\Services\Order;

use App\Enums\ShipmentStatus;
use App\Models\Shipment;
use InvalidArgumentException;

final class ShipmentStateService
{
    /** @var array<string, list<ShipmentStatus>> */
    private const TRANSITIONS = [
        'pending' => [ShipmentStatus::Prepared, ShipmentStatus::Cancelled],
        'prepared' => [ShipmentStatus::Shipped, ShipmentStatus::Cancelled],
        'shipped' => [ShipmentStatus::Delivered],
    ];

    public function markPrepared(Shipment $shipment): Shipment
    {
        if ($shipment->status === ShipmentStatus::Prepared) {
            return $shipment;
        }

        $this->assertTransition($shipment->status, ShipmentStatus::Prepared);
        $shipment->update(['status' => ShipmentStatus::Prepared]);

        return $shipment->fresh();
    }

    public function markShipped(Shipment $shipment, string $trackingNumber, ?string $carrier = null): Shipment
    {
        if ($shipment->status === ShipmentStatus::Shipped) {
            return $shipment;
        }

        $this->assertTransition($shipment->status, ShipmentStatus::Shipped);

        $trackingNumber = trim($trackingNumber);

        if ($trackingNumber === '') {
            throw new InvalidArgumentException(__('diyar.shipment.tracking_required'));
        }

        $shipment->update([
            'status' => ShipmentStatus::Shipped,
            'tracking_number' => $trackingNumber,
            'carrier' => $carrier !== null ? trim($carrier) : null,
            'shipped_at' => now(),
        ]);

        return $shipment->fresh();
    }

    public function markDelivered(Shipment $shipment): Shipment
    {
        if ($shipment->status === ShipmentStatus::Delivered) {
            return $shipment;
        }

        $this->assertTransition($shipment->status, ShipmentStatus::Delivered);
        $shipment->update([
            'status' => ShipmentStatus::Delivered,
            'delivered_at' => now(),
        ]);

        return $shipment->fresh();
    }

    public function markCancelled(Shipment $shipment): Shipment
    {
        if ($shipment->status === ShipmentStatus::Cancelled) {
            return $shipment;
        }

        $this->assertTransition($shipment->status, ShipmentStatus::Cancelled);
        $shipment->update(['status' => ShipmentStatus::Cancelled]);

        return $shipment->fresh();
    }

    private function assertTransition(ShipmentStatus $from, ShipmentStatus $to): void
    {
        $allowed = self::TRANSITIONS[$from->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw new InvalidArgumentException(__('diyar.order.invalid_status_transition'));
        }
    }
}
