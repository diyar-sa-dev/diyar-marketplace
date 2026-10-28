<?php

namespace App\Domains\Shipping\Gateways;

use App\Domains\Shipping\Contracts\CarrierGatewayInterface;
use App\Domains\Shipping\DTO\CarrierBookingRequest;
use App\Domains\Shipping\DTO\CarrierBookingResponse;
use App\Domains\Shipping\DTO\CarrierQuoteRequest;
use App\Domains\Shipping\DTO\CarrierQuoteResponse;
use App\Domains\Shipping\DTO\CarrierTrackingResponse;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

final class AyMakanCarrierGateway implements CarrierGatewayInterface
{
    private string $baseUrl;

    public function __construct(
        private readonly ?string $apiToken = null,
        private readonly bool $isSandbox = true,
    ) {
        $this->baseUrl = $this->isSandbox
            ? 'https://dev-api.aymakan.com.sa/v2'
            : 'https://api.aymakan.net/v2';
    }

    public function carrierCode(): string
    {
        return 'aymakan';
    }

    public function supportsLiveQuoting(): bool
    {
        return true;
    }

    public function supportsPickupBooking(): bool
    {
        return true;
    }

    public function supportsLabelGeneration(): bool
    {
        return true;
    }

    public function getQuote(CarrierQuoteRequest $request): CarrierQuoteResponse
    {
        if (empty($this->apiToken)) {
            return new CarrierQuoteResponse(
                isAvailable: false,
                quotedRate: '0.00',
                errorReason: 'AyMakan API credentials not configured',
            );
        }

        try {
            // Note: In sandbox / live mode without direct quote endpoint, fallback to standard contract pricing
            // AyMakan standard domestic rate baseline: 25.00 SAR
            $rate = 25.00;
            if ($request->billableWeightKg > 15.0) {
                return new CarrierQuoteResponse(
                    isAvailable: false,
                    quotedRate: '0.00',
                    errorReason: 'AyMakan parcel standard tier caps at 15kg; bulky furniture requires dedicated freight',
                );
            }

            return new CarrierQuoteResponse(
                isAvailable: true,
                quotedRate: number_format($rate, 2, '.', ''),
                estimatedDaysMin: 1,
                estimatedDaysMax: 2,
                carrierServiceCode: 'AYMAKAN-EXP',
            );
        } catch (\Throwable $e) {
            Log::warning('AyMakan quote failed: '.$e->getMessage());

            return new CarrierQuoteResponse(
                isAvailable: false,
                quotedRate: '0.00',
                errorReason: $e->getMessage(),
            );
        }
    }

    public function bookShipment(CarrierBookingRequest $request): CarrierBookingResponse
    {
        if (empty($this->apiToken)) {
            return new CarrierBookingResponse(
                isSuccess: false,
                bookingStatus: 'failed',
                errorMessage: 'AyMakan API token missing',
            );
        }

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/json',
                'Authorization' => $this->apiToken,
            ])->timeout(10.0)->post("{$this->baseUrl}/shipping/create", [
                'reference' => $request->idempotencyKey,
                'declared_value' => $request->declaredValue,
                'weight' => $request->parcelWeightKg,
                'pieces' => 1,
                'delivery_name' => $request->deliveryAddress->recipient_name,
                'delivery_phone' => $request->deliveryAddress->phone,
                'delivery_city' => $request->deliveryAddress->city,
                'delivery_address' => $request->deliveryAddress->street ?? $request->deliveryAddress->district ?? $request->deliveryAddress->city,
                'delivery_country' => 'SA',
                'collection_name' => $request->pickupAddress?->contact_name ?? 'DIYAR Warehouse',
                'collection_phone' => $request->pickupAddress?->contact_phone ?? '0500000000',
                'collection_city' => $request->pickupAddress?->city ?? 'Riyadh',
                'collection_address' => $request->pickupAddress?->street ?? 'Main Street',
                'collection_country' => 'SA',
                'is_cod' => 0,
            ]);

            if ($response->successful()) {
                $data = $response->json('data') ?? [];
                $tracking = $data['tracking_number'] ?? $data['reference'] ?? null;
                $labelUrl = $data['pdf_label'] ?? null;

                return new CarrierBookingResponse(
                    isSuccess: true,
                    bookingStatus: 'confirmed',
                    externalShipmentId: (string) ($data['id'] ?? $tracking),
                    trackingNumber: $tracking,
                    labelUrl: $labelUrl,
                    invoicedCost: '25.00',
                );
            }

            return new CarrierBookingResponse(
                isSuccess: false,
                bookingStatus: 'failed',
                errorMessage: $response->body(),
            );
        } catch (ConnectionException $e) {
            return new CarrierBookingResponse(
                isSuccess: false,
                bookingStatus: 'unknown_outcome',
                errorMessage: 'Connection timeout during AyMakan dispatch: '.$e->getMessage(),
            );
        } catch (\Throwable $e) {
            return new CarrierBookingResponse(
                isSuccess: false,
                bookingStatus: 'failed',
                errorMessage: $e->getMessage(),
            );
        }
    }

    public function getLabel(string $externalShipmentId): string
    {
        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Authorization' => $this->apiToken,
        ])->get("{$this->baseUrl}/shipping/awb/tracking/{$externalShipmentId}");

        if ($response->successful()) {
            return $response->body();
        }

        throw new \RuntimeException('Unable to retrieve label from AyMakan: '.$response->body());
    }

    public function trackShipment(string $trackingNumber): CarrierTrackingResponse
    {
        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Authorization' => $this->apiToken,
        ])->get("{$this->baseUrl}/shipping/track/{$trackingNumber}");

        if ($response->successful()) {
            $data = $response->json('data') ?? [];
            $status = $data['status'] ?? 'pending';

            $normalized = match (strtoupper($status)) {
                'DELIVERED' => 'delivered',
                'CANCELLED' => 'cancelled',
                'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'PICKED_UP' => 'shipped',
                default => 'prepared',
            };

            return new CarrierTrackingResponse(
                trackingNumber: $trackingNumber,
                normalizedStatus: $normalized,
                milestones: [],
                rawCarrierStatus: $status,
            );
        }

        return new CarrierTrackingResponse(
            trackingNumber: $trackingNumber,
            normalizedStatus: 'shipped',
            milestones: [],
            rawCarrierStatus: 'UNKNOWN',
        );
    }

    public function cancelShipment(string $externalShipmentId): bool
    {
        $response = Http::withHeaders([
            'Accept' => 'application/json',
            'Authorization' => $this->apiToken,
        ])->post("{$this->baseUrl}/shipping/cancel", [
            'tracking_number' => $externalShipmentId,
        ]);

        return $response->successful();
    }
}
