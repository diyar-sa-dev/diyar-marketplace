<?php

namespace App\Domains\Shipping\Gateways;

use App\Domains\Shipping\Contracts\CarrierGatewayInterface;
use App\Domains\Shipping\DTO\CarrierBookingRequest;
use App\Domains\Shipping\DTO\CarrierBookingResponse;
use App\Domains\Shipping\DTO\CarrierQuoteRequest;
use App\Domains\Shipping\DTO\CarrierQuoteResponse;
use App\Domains\Shipping\DTO\CarrierTrackingResponse;

final class MockCarrierGateway implements CarrierGatewayInterface
{
    private bool $shouldFailQuotes = false;

    private bool $shouldTimeoutBooking = false;

    public function carrierCode(): string
    {
        return 'mock';
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

    public function setShouldFailQuotes(bool $fail): self
    {
        $this->shouldFailQuotes = $fail;

        return $this;
    }

    public function setShouldTimeoutBooking(bool $timeout): self
    {
        $this->shouldTimeoutBooking = $timeout;

        return $this;
    }

    public function getQuote(CarrierQuoteRequest $request): CarrierQuoteResponse
    {
        if ($this->shouldFailQuotes) {
            return new CarrierQuoteResponse(
                isAvailable: false,
                quotedRate: '0.00',
                errorReason: 'Mock API quote service unavailable',
            );
        }

        // Tiered calculation: 20.00 base + 2.50 per kg over 1kg
        $rate = 20.00;
        if ($request->billableWeightKg > 1.0) {
            $rate += ($request->billableWeightKg - 1.0) * 2.50;
        }

        return new CarrierQuoteResponse(
            isAvailable: true,
            quotedRate: number_format($rate, 2, '.', ''),
            estimatedDaysMin: 1,
            estimatedDaysMax: 3,
            carrierServiceCode: 'MOCK-EXPRESS',
        );
    }

    public function bookShipment(CarrierBookingRequest $request): CarrierBookingResponse
    {
        if ($this->shouldTimeoutBooking) {
            return new CarrierBookingResponse(
                isSuccess: false,
                bookingStatus: 'unknown_outcome',
                errorMessage: 'Connection timed out while awaiting carrier gateway response',
            );
        }

        $tracking = 'MCK-'.substr(md5($request->vendorOrderId), 0, 10);
        $labelUrl = 'https://api.mockcarrier.diyar.local/labels/'.$tracking.'.pdf';

        return new CarrierBookingResponse(
            isSuccess: true,
            bookingStatus: 'confirmed',
            externalShipmentId: 'EXT-'.$request->vendorOrderId,
            trackingNumber: $tracking,
            labelUrl: $labelUrl,
            invoicedCost: '22.50',
        );
    }

    public function getLabel(string $externalShipmentId): string
    {
        return "%PDF-1.4 Mock AWB Label for {$externalShipmentId} %%EOF";
    }

    public function trackShipment(string $trackingNumber): CarrierTrackingResponse
    {
        return new CarrierTrackingResponse(
            trackingNumber: $trackingNumber,
            normalizedStatus: 'shipped',
            milestones: [
                [
                    'raw_status' => 'PICKED_UP',
                    'normalized_status' => 'shipped',
                    'timestamp' => now()->toIso8601String(),
                    'location' => 'Riyadh Hub',
                    'description' => 'Package received at warehouse',
                ],
            ],
            rawCarrierStatus: 'IN_TRANSIT_HUB',
        );
    }

    public function cancelShipment(string $externalShipmentId): bool
    {
        return true;
    }
}
