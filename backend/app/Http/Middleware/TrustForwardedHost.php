<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/**
 * When Vercel proxies /api and /sanctum, honour X-Forwarded-* so Sanctum treats
 * the SPA as first-party (same host as Origin) and session cookies use lax.
 */
final class TrustForwardedHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->header('X-Forwarded-Host');

        if (! is_string($host) || $host === '' || str_contains($host, ',')) {
            return $next($request);
        }

        $host = strtolower(trim($host));
        $scheme = $request->header('X-Forwarded-Proto', 'https');

        URL::forceRootUrl(sprintf('%s://%s', $scheme, $host));
        $request->headers->set('HOST', $host);
        $request->server->set('HTTP_HOST', $host);
        $request->server->set('SERVER_NAME', $host);

        return $next($request);
    }
}
