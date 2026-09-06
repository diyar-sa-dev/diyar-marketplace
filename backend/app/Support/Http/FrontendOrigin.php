<?php

namespace App\Support\Http;

use Illuminate\Http\Request;

/**
 * Resolves the storefront origin for redirects (payment return URLs, etc.).
 *
 * Prefers the incoming Origin/Referer so LAN IP and localhost both work without
 * changing FRONTEND_URL when switching devices.
 */
final class FrontendOrigin
{
    public static function base(?Request $request = null): string
    {
        $request ??= request();

        if ($request instanceof Request) {
            $fromOrigin = self::fromOriginHeader($request->header('Origin'));
            if ($fromOrigin !== null) {
                return $fromOrigin;
            }

            $fromReferer = self::fromRefererHeader($request->header('Referer'));
            if ($fromReferer !== null) {
                return $fromReferer;
            }
        }

        return rtrim((string) config('diyar.frontend_url'), '/');
    }

    public static function url(string $path, ?Request $request = null): string
    {
        $normalizedPath = str_starts_with($path, '/') ? $path : '/'.$path;

        return self::base($request).$normalizedPath;
    }

    private static function fromOriginHeader(mixed $origin): ?string
    {
        if (! is_string($origin) || $origin === '') {
            return null;
        }

        return self::isAllowedOrigin($origin) ? rtrim($origin, '/') : null;
    }

    private static function fromRefererHeader(mixed $referer): ?string
    {
        if (! is_string($referer) || $referer === '') {
            return null;
        }

        $parts = parse_url($referer);
        if (! is_array($parts) || ! isset($parts['scheme'], $parts['host'])) {
            return null;
        }

        $port = isset($parts['port']) ? ':'.$parts['port'] : '';
        $candidate = $parts['scheme'].'://'.$parts['host'].$port;

        return self::isAllowedOrigin($candidate) ? $candidate : null;
    }

    private static function isAllowedOrigin(string $origin): bool
    {
        $host = parse_url($origin, PHP_URL_HOST);
        if (! is_string($host) || $host === '') {
            return false;
        }

        $port = parse_url($origin, PHP_URL_PORT);
        $hostWithPort = $port !== null ? "{$host}:{$port}" : $host;

        /** @var list<string> $stateful */
        $stateful = array_map('trim', config('sanctum.stateful', []));

        return in_array($host, $stateful, true) || in_array($hostWithPort, $stateful, true);
    }
}
