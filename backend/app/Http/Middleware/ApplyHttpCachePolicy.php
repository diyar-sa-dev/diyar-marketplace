<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Sets Cache-Control / Vary for API responses (Phase 28.13).
 *
 * Security rule: authenticated, cookie-session, authorization header, private routes,
 * or mutating requests are never publicly cached.
 */
class ApplyHttpCachePolicy
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        if (! $request->is('api/*')) {
            return $response;
        }

        if (! in_array($request->method(), ['GET', 'HEAD'], true)) {
            $this->applyPrivateNoStore($response, $request);

            return $response;
        }

        if (
            $this->isAuthenticated($request)
            || $this->hasSessionCookies($request)
            || $this->hasAuthorizationHeader($request)
            || $this->isPrivateReadPath($request)
        ) {
            $this->applyPrivateNoStore($response, $request);

            return $response;
        }

        if ($this->isHealthPath($request)) {
            $this->applyHealthCache($response);

            return $response;
        }

        if ($this->isPublicReadPath($request)) {
            $this->applyPublicReadCache($response, $request);

            return $response;
        }

        $this->applyPrivateNoStore($response, $request);

        return $response;
    }

    private function isAuthenticated(Request $request): bool
    {
        return $request->user() !== null || $request->user('admin') !== null;
    }

    private function hasAuthorizationHeader(Request $request): bool
    {
        $authorization = trim((string) $request->headers->get('Authorization', ''));

        return $authorization !== '';
    }

    private function hasSessionCookies(Request $request): bool
    {
        $sessionCookie = (string) config('session.cookie', 'laravel_session');

        if ($request->cookies->has($sessionCookie) || $request->cookies->has('XSRF-TOKEN')) {
            return true;
        }

        $cookieHeader = (string) $request->headers->get('Cookie', '');

        return str_contains($cookieHeader, "{$sessionCookie}=")
            || str_contains($cookieHeader, 'XSRF-TOKEN=');
    }

    private function isHealthPath(Request $request): bool
    {
        $path = $this->apiRelativePath($request);

        return in_array($path, ['health', 'health/live', 'health/ready', 'readiness'], true);
    }

    private function isPrivateReadPath(Request $request): bool
    {
        $path = $this->apiRelativePath($request);
        /** @var list<string> $prefixes */
        $prefixes = config('diyar_delivery.private_read_prefixes', []);

        foreach ($prefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }

    private function isPublicReadPath(Request $request): bool
    {
        $path = $this->apiRelativePath($request);
        /** @var list<string> $prefixes */
        $prefixes = config('diyar_delivery.public_read_prefixes', []);

        foreach ($prefixes as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }

    private function apiRelativePath(Request $request): string
    {
        $path = ltrim($request->path(), '/');

        if (str_starts_with($path, 'api/v1/')) {
            return substr($path, strlen('api/v1/'));
        }

        if (str_starts_with($path, 'api/')) {
            return substr($path, strlen('api/'));
        }

        return $path;
    }

    private function applyPrivateNoStore(Response $response, Request $request): void
    {
        $response->headers->set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $this->appendVary($response, ['Cookie', 'Authorization', 'Accept-Language', 'Origin']);
    }

    private function applyHealthCache(Response $response): void
    {
        $maxAge = (int) config('diyar_delivery.http_cache.health_seconds', 15);
        $response->headers->set('Cache-Control', "public, max-age={$maxAge}, must-revalidate");
        $this->appendVary($response, ['Accept-Language']);
    }

    private function applyPublicReadCache(Response $response, Request $request): void
    {
        $path = $this->apiRelativePath($request);
        /** @var list<string> $platformPaths */
        $platformPaths = config('diyar_delivery.platform_config_paths', []);

        $maxAge = in_array($path, $platformPaths, true)
            ? (int) config('diyar_delivery.http_cache.platform_config_seconds', 300)
            : (int) config('diyar_delivery.http_cache.public_api_seconds', 60);

        $swr = (int) config('diyar_delivery.http_cache.public_api_stale_while_revalidate', 120);

        $response->headers->set(
            'Cache-Control',
            "public, max-age={$maxAge}, stale-while-revalidate={$swr}",
        );
        $this->appendVary($response, ['Accept-Language', 'Origin']);
    }

    /**
     * @param  list<string>  $values
     */
    private function appendVary(Response $response, array $values): void
    {
        $existing = array_filter(array_map('trim', explode(',', (string) $response->headers->get('Vary', ''))));
        $merged = array_values(array_unique([...$existing, ...$values]));
        $response->headers->set('Vary', implode(', ', $merged));
    }
}
