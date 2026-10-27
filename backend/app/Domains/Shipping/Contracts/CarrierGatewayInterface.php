<?php

namespace App\Domains\Shipping\Contracts;

use App\Domains\Shipping\DTO\CarrierBookingRequest;
use App\Domains\Shipping\DTO\CarrierBookingResponse;
use App\Domains\Shipping\DTO\CarrierQuoteRequest;
use App\Domains\Shipping\DTO\CarrierQuoteResponse;
use App\Domains\Shipping\DTO\CarrierTrackingResponse;

interface CarrierGatewayInterface
{
    public function carrierCode(): string;

    public function supportsLiveQuoting(): bool;

    public function supportsPickupBooking(): bool;

    public function supportsLabelGeneration(): bool;

    public function getQuote(CarrierQuoteRequest $request): CarrierQuoteResponse;

    public function bookShipment(CarrierBookingRequest $request): CarrierBookingResponse;

    public function getLabel(string $externalShipmentId): string;

    public function trackShipment(string $trackingNumber): CarrierTrackingResponse;

    public function cancelShipment(string $externalShipmentId): bool;
}
