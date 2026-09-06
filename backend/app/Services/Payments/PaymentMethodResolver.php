<?php

namespace App\Services\Payments;

use App\Enums\PaymentMethod;
use App\Services\Payments\DTO\PaymentMethodCapability;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class PaymentMethodResolver
{
    /**
     * @param  list<PaymentMethodCapability>  $gatewayMethods
     * @return list<array{code: string, available: bool, label: string}>
     */
    public function presentCheckoutMethods(array $gatewayMethods): array
    {
        $availableGatewayCodes = array_map(
            static fn (PaymentMethodCapability $method): string => strtolower($method->code),
            array_values(array_filter($gatewayMethods, static fn (PaymentMethodCapability $method): bool => $method->available)),
        );

        return array_map(
            fn (PaymentMethod $method): array => [
                'code' => $method->value,
                'available' => $this->isAvailable($method, $availableGatewayCodes),
                'label' => $this->labelFor($method),
            ],
            PaymentMethod::checkoutMethods(),
        );
    }

    /**
     * @param  list<PaymentMethodCapability>  $gatewayMethods
     */
    public function resolveGatewayCode(PaymentMethod $method, array $gatewayMethods): ?string
    {
        $availableGatewayCodes = array_map(
            static fn (PaymentMethodCapability $entry): string => strtolower($entry->code),
            array_values(array_filter($gatewayMethods, static fn (PaymentMethodCapability $entry): bool => $entry->available)),
        );

        foreach ($method->gatewayCodes() as $candidate) {
            if (in_array(strtolower($candidate), $availableGatewayCodes, true)) {
                return $candidate;
            }
        }

        return null;
    }

    public function parseRequired(?string $raw): PaymentMethod
    {
        $method = PaymentMethod::tryFromLegacy($raw);

        if ($method === null) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.invalid_payment_method'));
        }

        return $method;
    }

    /**
     * @param  list<PaymentMethodCapability>  $gatewayMethods
     */
    public function assertAvailable(PaymentMethod $method, array $gatewayMethods): string
    {
        $gatewayCode = $this->resolveGatewayCode($method, $gatewayMethods);

        if ($gatewayCode === null) {
            throw new UnprocessableEntityHttpException(__('diyar.payment.payment_method_unavailable'));
        }

        return $gatewayCode;
    }

    /**
     * @param  list<string>  $availableGatewayCodes
     */
    private function isAvailable(PaymentMethod $method, array $availableGatewayCodes): bool
    {
        foreach ($method->gatewayCodes() as $candidate) {
            if (in_array(strtolower($candidate), $availableGatewayCodes, true)) {
                return true;
            }
        }

        return false;
    }

    private function labelFor(PaymentMethod $method): string
    {
        return match ($method) {
            PaymentMethod::Mada => __('diyar.payment.checkout_method_mada'),
            PaymentMethod::Card => __('diyar.payment.checkout_method_card'),
            PaymentMethod::ApplePay => __('diyar.payment.checkout_method_apple_pay'),
            PaymentMethod::Tabby => __('diyar.payment.checkout_method_tabby'),
        };
    }
}
