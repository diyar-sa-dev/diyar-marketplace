<?php

namespace App\Domains\Shipping\Services;

use App\Domains\Orders\Services\ShipmentStateService;
use App\Domains\Orders\Services\VendorOrderStateService;
use App\Domains\Shipping\Contracts\CarrierGatewayInterface;
use App\Domains\Shipping\DTO\CarrierBookingRequest;
use App\Domains\Shipping\DTO\CarrierQuoteRequest;
use App\Domains\Shipping\DTO\CarrierQuoteResponse;
use App\Models\Address;
use App\Models\CarrierBookingAttempt;
use App\Models\CarrierShipment;
use App\Models\VendorOrder;
use App\Models\VendorPickupAddress;
use App\Models\VendorShippingSettings;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class CarrierBookingOrchestrationService
{
    public function __construct(
        private readonly CarrierGatewayManager $gatewayManager,
        private readonly ShipmentStateService $shipmentState,
        private readonly VendorOrderStateService $vendorOrderState,
    ) {}

    public function quote(
        VendorShippingSettings $settings,
        Address $destination,
        float $weightKg,
        float $declaredValue = 0.0,
    ): CarrierQuoteResponse {
        $carrierCode = $settings->selected_carrier_code ?? 'mock';
        $gateway = $this->gatewayManager->resolve($carrierCode);

        $pickup = VendorPickupAddress::query()
            ->where('vendor_account_id', $settings->vendor_account_id)
            ->where('is_default', true)
            ->first();

        $request = new CarrierQuoteRequest(
            originAddress: $pickup,
            destinationAddress: $destination,
            billableWeightKg: $weightKg,
            declaredValue: $declaredValue,
        );

        return $gateway->getQuote($request);
    }

    public function book(VendorOrder $vendorOrder, ?string $carrierCode = null): CarrierShipment
    {
        return DB::transaction(function () use ($vendorOrder, $carrierCode): CarrierShipment {
            $lockedOrder = VendorOrder::query()->whereKey($vendorOrder->id)->lockForUpdate()->firstOrFail();
            $shipment = $lockedOrder->shipment ?? throw new \RuntimeException('Shipment record missing for vendor order');

            $carrierShipment = CarrierShipment::query()->firstOrCreate(
                ['shipment_id' => $shipment->id],
                [
                    'carrier_code' => $carrierCode ?? 'mock',
                    'booking_status' => 'pending',
                ]
            );

            if ($carrierShipment->booking_status === 'confirmed') {
                return $carrierShipment;
            }

            $gateway = $this->gatewayManager->resolve($carrierShipment->carrier_code);
            // Stable idempotency key per vendor order attempt
            $attemptCount = CarrierBookingAttempt::query()->where('carrier_shipment_id', $carrierShipment->id)->count() + 1;
            $idempotencyKey = "VO-{$lockedOrder->id}-{$attemptCount}";

            $pickup = VendorPickupAddress::query()
                ->where('vendor_account_id', $lockedOrder->vendor_account_id)
                ->where('is_default', true)
                ->first();

            $bookingRequest = new CarrierBookingRequest(
                vendorOrderId: $lockedOrder->id,
                idempotencyKey: $idempotencyKey,
                pickupAddress: $pickup,
                deliveryAddress: $lockedOrder->order->shippingAddress,
                parcelWeightKg: 2.5, // Standard parcel default
                declaredValue: (float) $lockedOrder->subtotal,
                description: 'DIYAR Marketplace Order #'.$lockedOrder->order->order_number,
            );

            // Record initial attempt
            $attempt = CarrierBookingAttempt::query()->create([
                'carrier_shipment_id' => $carrierShipment->id,
                'idempotency_key' => $idempotencyKey,
                'status' => 'initiated',
            ]);

            try {
                $response = $gateway->bookShipment($bookingRequest);

                if ($response->isSuccess && $response->bookingStatus === 'confirmed') {
                    $carrierShipment->update([
                        'external_shipment_id' => $response->externalShipmentId,
                        'tracking_number' => $response->trackingNumber,
                        'label_url' => $response->labelUrl,
                        'carrier_actual_cost' => $response->invoicedCost,
                        'booking_status' => 'confirmed',
                        'booked_at' => now(),
                    ]);

                    $attempt->update(['status' => 'succeeded']);

                    // Advance core Shipment to shipped
                    $this->shipmentState->markShipped(
                        $shipment,
                        $response->trackingNumber,
                        $gateway->carrierCode(),
                    );
                    $this->vendorOrderState->markShipped($lockedOrder);

                    return $carrierShipment->fresh();
                }

                if ($response->bookingStatus === 'unknown_outcome') {
                    $carrierShipment->update(['booking_status' => 'unknown_outcome']);
                    $attempt->update([
                        'status' => 'timeout',
                        'error_message' => $response->errorMessage,
                    ]);

                    return $carrierShipment->fresh();
                }

                $carrierShipment->update(['booking_status' => 'failed']);
                $attempt->update([
                    'status' => 'failed',
                    'error_message' => $response->errorMessage,
                ]);

                return $carrierShipment->fresh();
            } catch (\Throwable $e) {
                Log::error("Carrier booking exception for {$lockedOrder->id}: ".$e->getMessage());

                $carrierShipment->update(['booking_status' => 'unknown_outcome']);
                $attempt->update([
                    'status' => 'timeout',
                    'error_message' => $e->getMessage(),
                ]);

                return $carrierShipment->fresh();
            }
        });
    }

    public function reconcileUnknown(CarrierShipment $carrierShipment): bool
    {
        if ($carrierShipment->booking_status !== 'unknown_outcome') {
            return false;
        }

        $gateway = $this->gatewayManager->resolve($carrierShipment->carrier_code);

        // In a real provider, we query /shipments?reference={idempotency_key}
        // Here we simulate safe reconciliation check:
        if ($carrierShipment->tracking_number) {
            $tracking = $gateway->trackShipment($carrierShipment->tracking_number);
            if ($tracking->normalizedStatus !== 'cancelled') {
                $carrierShipment->update(['booking_status' => 'confirmed']);

                return true;
            }
        }

        return false;
    }
}
