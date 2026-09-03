<?php

namespace App\Support\Http;

/**
 * Trusted reverse-proxy CIDRs for Laravel Request::ip().
 *
 * Production topology: Client → Cloudflare → Nginx → PHP-FPM/Octane.
 * Laravel must trust only the immediate proxy hop (Docker bridge / host Nginx),
 * not arbitrary X-Forwarded-For chains from the public internet.
 */
final class TrustedProxies
{
    /**
     * @return list<string>
     */
    public static function addresses(): array
    {
        $configured = trim((string) env('TRUSTED_PROXIES', ''));

        if ($configured !== '') {
            return array_values(array_filter(array_map('trim', explode(',', $configured))));
        }

        return [
            '127.0.0.1',
            '::1',
            '10.0.0.0/8',
            '172.16.0.0/12',
            '192.168.0.0/16',
        ];
    }
}
