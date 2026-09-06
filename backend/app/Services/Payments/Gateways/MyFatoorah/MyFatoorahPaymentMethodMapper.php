<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\DTO\PaymentMethodCapability;

final class MyFatoorahPaymentMethodMapper
{
    /**
     * @param  array<string, list<object>>  $gatewayGroups
     * @return list<PaymentMethodCapability>
     */
    public function mapCheckoutGateways(array $gatewayGroups): array
    {
        $methods = [];
        $seen = [];

        foreach ($gatewayGroups['all'] ?? [] as $gateway) {
            $code = strtolower((string) ($gateway->PaymentMethodCode ?? ''));

            if ($code === '' || isset($seen[$code])) {
                continue;
            }

            $seen[$code] = true;
            $methods[] = new PaymentMethodCapability(
                code: $this->normalizeCode($code),
                available: true,
                label: (string) ($gateway->PaymentMethodEn ?? $gateway->PaymentMethodAr ?? $code),
            );
        }

        return $methods;
    }

    private function normalizeCode(string $code): string
    {
        return match ($code) {
            'ap' => 'apple_pay',
            'gp' => 'google_pay',
            'md' => 'mada',
            'vm' => 'visa_master',
            default => $code,
        };
    }

    /**
     * Map DIYAR / embedded gateway codes to MyFatoorah v3 PaymentMethod values.
     */
    public static function toGatewayPaymentMethod(?string $code): ?string
    {
        if ($code === null || $code === '') {
            return null;
        }

        $normalized = strtolower($code);

        return match ($normalized) {
            'apple_pay', 'ap' => 'APPLE_PAY',
            'google_pay', 'gp' => 'GOOGLE_PAY',
            'knet', 'kn' => 'KNET',
            'mada', 'md', 'visa_master', 'vm', 'visa', 'master', 'creditcard', 'card' => 'CARD',
            'tabby' => 'TABBY',
            default => null,
        };
    }
}
