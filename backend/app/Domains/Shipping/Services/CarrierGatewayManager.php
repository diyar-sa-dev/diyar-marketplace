<?php

namespace App\Domains\Shipping\Services;

use App\Domains\Shipping\Contracts\CarrierGatewayInterface;
use App\Domains\Shipping\Gateways\AyMakanCarrierGateway;
use App\Domains\Shipping\Gateways\MockCarrierGateway;
use App\Models\CarrierConfiguration;

final class CarrierGatewayManager
{
    /** @var array<string, CarrierGatewayInterface> */
    private array $customGateways = [];

    public function registerGateway(CarrierGatewayInterface $gateway): void
    {
        $this->customGateways[$gateway->carrierCode()] = $gateway;
    }

    public function resolve(string $carrierCode): CarrierGatewayInterface
    {
        if (isset($this->customGateways[$carrierCode])) {
            return $this->customGateways[$carrierCode];
        }

        if ($carrierCode === 'mock') {
            return new MockCarrierGateway;
        }

        $config = CarrierConfiguration::query()->where('carrier_code', $carrierCode)->first();

        if ($carrierCode === 'aymakan') {
            $token = $config?->api_token_encrypted ?? config('services.aymakan.token');
            $isSandbox = $config?->is_sandbox ?? true;

            return new AyMakanCarrierGateway($token, $isSandbox);
        }

        // Default safe fallback to Mock
        return new MockCarrierGateway;
    }
}
