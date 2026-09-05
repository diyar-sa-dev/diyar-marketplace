<?php

namespace App\Support\Http;

/**
 * Builds Sanctum/CORS/Reverb host allow-lists from a single LAN knob (DIYAR_LAN_HOST).
 *
 * Set DIYAR_LAN_HOST=auto in deploy/docker/production.env; scripts/local/Sync-ProductionEnv.ps1
 * resolves it to your Wi‑Fi IP before Docker starts. PHP also expands *_BASE lists at runtime.
 */
final class DiyarNetworkOrigins
{
    /**
     * @return list<string>
     */
    public static function statefulDomains(): array
    {
        $domains = self::splitEnvList(
            (string) env(
                'SANCTUM_STATEFUL_DOMAINS_BASE',
                'localhost,localhost:3000,127.0.0.1,127.0.0.1:3000',
            ),
        );

        $domains = array_merge($domains, self::lanHostVariants());

        $legacy = self::splitEnvList((string) env('SANCTUM_STATEFUL_DOMAINS', ''));
        if ($legacy !== []) {
            $domains = array_merge($domains, $legacy);
        }

        return self::uniqueNonEmpty($domains);
    }

    /**
     * @return list<string>
     */
    public static function corsOrigins(): array
    {
        $origins = array_filter([
            env('FRONTEND_URL', 'http://localhost:3000'),
            env('DIYAR_FRONTEND_URL'),
        ]);

        $origins = array_merge(
            $origins,
            self::splitEnvList(
                (string) env(
                    'CORS_ALLOWED_ORIGINS_BASE',
                    'http://localhost:3000,http://127.0.0.1:3000',
                ),
            ),
        );

        $lan = self::lanHost();
        if ($lan !== null) {
            $frontendPort = (string) env('FRONTEND_PORT', '3000');
            $origins[] = "http://{$lan}:{$frontendPort}";
        }

        $legacy = self::splitEnvList((string) env('CORS_ALLOWED_ORIGINS', ''));
        if ($legacy !== []) {
            $origins = array_merge($origins, $legacy);
        }

        return self::uniqueNonEmpty($origins);
    }

    /**
     * @return list<string>
     */
    public static function reverbOrigins(): array
    {
        $origins = array_filter([
            env('FRONTEND_URL', 'http://localhost:3000'),
            env('DIYAR_FRONTEND_URL'),
        ]);

        $origins = array_merge($origins, self::corsOrigins());

        return self::uniqueNonEmpty($origins);
    }

    public static function lanHost(): ?string
    {
        $host = trim((string) env('DIYAR_LAN_HOST', ''));

        if ($host === '' || strtolower($host) === 'auto') {
            return null;
        }

        return $host;
    }

    public static function apiBaseUrl(): string
    {
        $lan = self::lanHost();
        $port = (string) env('HTTP_PORT', '8093');

        if ($lan !== null) {
            return "http://{$lan}:{$port}";
        }

        return rtrim((string) env('APP_URL', 'http://127.0.0.1:8093'), '/');
    }

    /**
     * @return list<string>
     */
    private static function lanHostVariants(): array
    {
        $lan = self::lanHost();
        if ($lan === null) {
            return [];
        }

        $frontendPort = (string) env('FRONTEND_PORT', '3000');
        $httpPort = (string) env('HTTP_PORT', '8093');

        return [
            $lan,
            "{$lan}:{$frontendPort}",
            "{$lan}:{$httpPort}",
        ];
    }

    /**
     * @return list<string>
     */
    private static function splitEnvList(string $value): array
    {
        if ($value === '') {
            return [];
        }

        return array_map('trim', explode(',', $value));
    }

    /**
     * @param  list<string|null>  $values
     * @return list<string>
     */
    private static function uniqueNonEmpty(array $values): array
    {
        return array_values(array_unique(array_filter(array_map(
            static fn (?string $value): string => trim((string) $value),
            $values,
        ), static fn (string $value): bool => $value !== '')));
    }
}
