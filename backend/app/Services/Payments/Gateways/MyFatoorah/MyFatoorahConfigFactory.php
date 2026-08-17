<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Services\Payments\Exceptions\PaymentGatewayException;

final class MyFatoorahConfigFactory
{
    /**
     * @return array{apiKey: string, isTest: bool, countryCode: string}
     */
    public static function libraryConfig(): array
    {
        $apiKey = (string) config('myfatoorah.api_key');

        return [
            'apiKey' => $apiKey,
            'isTest' => (bool) config('myfatoorah.test_mode'),
            'countryCode' => self::resolveCountryCode($apiKey),
        ];
    }

    /**
     * MyFatoorah API keys are scoped by country prefix, e.g. SK_SAU_… or SK_KWT_….
     */
    private static function resolveCountryCode(string $apiKey): string
    {
        if (preg_match('/^SK_([A-Z]{3})_/i', $apiKey, $matches) === 1) {
            return strtoupper($matches[1]);
        }

        return strtoupper((string) config('myfatoorah.country_iso', 'SAU'));
    }

    public static function assertConfigured(): void
    {
        if (config('myfatoorah.api_key') === '') {
            throw PaymentGatewayException::configuration(
                __('diyar.payment.gateway_not_configured')
            );
        }
    }

    public static function mobileCountryCode(): string
    {
        return match (self::resolveCountryCode((string) config('myfatoorah.api_key'))) {
            'KWT' => '+965',
            'ARE' => '+971',
            'BHR' => '+973',
            'OMN' => '+968',
            'QAT' => '+974',
            'EGY' => '+20',
            'JOR' => '+962',
            default => '+966',
        };
    }

    public static function integrationRedirectUrl(string $path): string
    {
        $base = rtrim((string) (config('myfatoorah.redirect_url') ?: config('diyar.frontend_url')), '/');

        return $base.'/'.ltrim($path, '/');
    }

    public static function assertHttpsRedirect(string $url): void
    {
        if (str_starts_with($url, 'https://')) {
            return;
        }

        throw PaymentGatewayException::configuration(
            __('diyar.payment.redirect_url_must_be_https')
        );
    }
}
