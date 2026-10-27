<?php

namespace App\Domains\Shipping\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Orders\Services\ShipmentStateService;
use App\Http\Controllers\Controller;
use App\Models\CarrierConfiguration;
use App\Models\CarrierShipment;
use App\Models\CarrierWebhookEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ShippingWebhookController extends Controller
{
    public function __construct(
        private readonly ShipmentStateService $shipmentState,
    ) {}

    public function handle(Request $request, string $carrier): JsonResponse
    {
        $config = CarrierConfiguration::query()->where('carrier_code', $carrier)->first();

        // 1. Secret / Signature Verification
        if ($config && ! empty($config->webhook_secret_encrypted)) {
            $expectedSignature = hash_hmac('sha256', $request->getContent(), $config->webhook_secret_encrypted);
            $signature = $request->header('X-Webhook-Signature') ?? $request->header('Authorization');

            if (! hash_equals($expectedSignature, (string) $signature)) {
                return response()->json(['error' => 'Invalid webhook signature'], 401);
            }
        }

        // 2. Extract Event ID & Deduplication
        $eventId = (string) ($request->input('event_id') ?? $request->input('order_id') ?? md5($request->getContent()));

        $existing = CarrierWebhookEvent::query()
            ->where('carrier_code', $carrier)
            ->where('provider_event_id', $eventId)
            ->first();

        if ($existing) {
            return ApiResponse::success(message: 'Webhook duplicate ignored');
        }

        $trackingNumber = (string) ($request->input('tracking_number') ?? $request->input('tracking_id'));
        $rawStatus = (string) ($request->input('status') ?? $request->input('shipment_status') ?? 'shipped');

        CarrierWebhookEvent::query()->create([
            'carrier_code' => $carrier,
            'provider_event_id' => $eventId,
            'event_type' => 'tracking_update',
            'tracking_number' => $trackingNumber,
            'payload' => $request->all(),
            'is_processed' => true,
        ]);

        // 3. Normalized State Update
        if ($trackingNumber) {
            $carrierShipment = CarrierShipment::query()
                ->where('tracking_number', $trackingNumber)
                ->with('shipment')
                ->first();

            if ($carrierShipment && $carrierShipment->shipment) {
                $shipment = $carrierShipment->shipment;

                $normalized = match (strtoupper($rawStatus)) {
                    'DELIVERED', 'POD_RECEIVED' => 'delivered',
                    'CANCELLED' => 'cancelled',
                    default => 'shipped',
                };

                try {
                    if ($normalized === 'delivered' && $shipment->status->value !== 'delivered') {
                        $this->shipmentState->markDelivered($shipment);
                    }
                } catch (\Throwable $e) {
                    Log::warning("Webhook transition error on shipment {$shipment->id}: ".$e->getMessage());
                }
            }
        }

        return ApiResponse::success(message: 'Webhook processed successfully');
    }
}
