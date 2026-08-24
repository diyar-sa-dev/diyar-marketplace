<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/**
 * When Vercel proxies /api and /sanctum, honour X-Forwarded-* so Sanctum cookies
 * are scoped to the Vercel hostname (first-party), not *.onrender.com.
 */
final class TrustForwardedHost
{
    public function handle(Request $request, Closure $next): Response
    {
        $host = $request->header('X-Forwarded-Host');

        if (is_string($host) && $host !== '' && ! str_contains($host, ',')) {
            $scheme = $request->header('X-Forwarded-Proto', 'https');
            URL::forceRootUrl(sprintf('%s://%s', $scheme, $host));
        }

        return $next($request);
    }
}
