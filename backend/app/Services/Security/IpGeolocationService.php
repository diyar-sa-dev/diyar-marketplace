<?php

namespace App\Services\Security;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

final class IpGeolocationService
{
    /**
     * Registration/login hot path — never blocks on external HTTP lookups.
     *
     * @return array{
     *     country: string|null,
     *     city: string|null,
     *     region: string|null,
     *     location_source: string
     * }
     */
    public function resolveForRegistration(Request $request): array
    {
        $fromHeaders = $this->resolveFromTrustedProxyHeaders($request);

        return $fromHeaders ?? $this->emptyResult('unknown');
    }

    /**
     * @return array{
     *     country: string|null,
     *     city: string|null,
     *     region: string|null,
     *     location_source: string
     * }
     */
    public function resolve(Request $request): array
    {
        $fromHeaders = $this->resolveFromTrustedProxyHeaders($request);
        if ($fromHeaders !== null) {
            return $fromHeaders;
        }

        if (! (bool) config('diyar.security.ip_geolocation_enabled', false)) {
            return $this->emptyResult('unknown');
        }

        $ip = $request->ip();
        if ($ip === null || self::isPrivateOrLocal($ip)) {
            return $this->emptyResult('unknown');
        }

        return $this->lookupRemote($ip);
    }

    /**
     * Cached lookup for session list display — never used on auth hot paths.
     *
     * @return array{
     *     country: string|null,
     *     city: string|null,
     *     region: string|null,
     *     location_source: string
     * }
     */
    public function resolveForStoredIp(?string $ip): array
    {
        if ($ip === null || trim($ip) === '') {
            return $this->emptyResult('unknown');
        }

        if (self::isPrivateOrLocal($ip)) {
            return $this->emptyResult('local_network');
        }

        if (! (bool) config('diyar.security.ip_geolocation_enabled', false)) {
            return $this->emptyResult('unknown');
        }

        $cacheTtl = (int) config('diyar.security.ip_geolocation_cache_seconds', 86_400);

        return Cache::remember(
            'ip_geo:'.hash('sha256', $ip),
            max($cacheTtl, 60),
            fn (): array => $this->lookupRemote($ip),
        );
    }

    public static function isPrivateOrLocal(string $ip): bool
    {
        return filter_var(
            $ip,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE,
        ) === false;
    }

    /**
     * @return array{
     *     country: string|null,
     *     city: string|null,
     *     region: string|null,
     *     location_source: string
     * }|null
     */
    private function resolveFromTrustedProxyHeaders(Request $request): ?array
    {
        if (! (bool) config('diyar.security.trust_geo_proxy_headers', false)) {
            return null;
        }

        $country = $this->firstHeader($request, [
            'CF-IPCountry',
            'X-Vercel-IP-Country',
            'CloudFront-Viewer-Country',
        ]);

        if ($country === null || strtoupper($country) === 'XX') {
            return null;
        }

        $city = $this->firstHeader($request, [
            'CF-IPCity',
            'X-Vercel-IP-City',
        ]);

        $region = $this->firstHeader($request, [
            'CF-IPRegion',
            'X-Vercel-IP-Country-Region',
        ]);

        return [
            'country' => strtoupper($country),
            'city' => $city,
            'region' => $region,
            'location_source' => 'proxy_header',
        ];
    }

    /**
     * @return array{
     *     country: string|null,
     *     city: string|null,
     *     region: string|null,
     *     location_source: string
     * }
     */
    private function lookupRemote(string $ip): array
    {
        try {
            $response = Http::timeout(2)
                ->acceptJson()
                ->get('http://ip-api.com/json/'.urlencode($ip), [
                    'fields' => 'status,country,regionName,city',
                ]);

            if (! $response->ok()) {
                return $this->emptyResult('unknown');
            }

            $payload = $response->json();
            if (! is_array($payload) || ($payload['status'] ?? null) !== 'success') {
                return $this->emptyResult('unknown');
            }

            return [
                'country' => isset($payload['country']) ? (string) $payload['country'] : null,
                'city' => isset($payload['city']) ? (string) $payload['city'] : null,
                'region' => isset($payload['regionName']) ? (string) $payload['regionName'] : null,
                'location_source' => 'ip_geolocation',
            ];
        } catch (\Throwable) {
            return $this->emptyResult('unknown');
        }
    }

    /**
     * @param  list<string>  $names
     */
    private function firstHeader(Request $request, array $names): ?string
    {
        foreach ($names as $name) {
            $value = trim((string) $request->headers->get($name, ''));
            if ($value !== '') {
                return $value;
            }
        }

        return null;
    }

    /**
     * @return array{
     *     country: string|null,
     *     city: string|null,
     *     region: string|null,
     *     location_source: string
     * }
     */
    private function emptyResult(string $source): array
    {
        return [
            'country' => null,
            'city' => null,
            'region' => null,
            'location_source' => $source,
        ];
    }
}
