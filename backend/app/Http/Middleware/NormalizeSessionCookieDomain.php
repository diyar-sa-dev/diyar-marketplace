<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Prevent session cookie domain mismatches from crashing stateful SPA requests.
 *
 * Render API host (*.onrender.com) must not reuse a Vercel-only SESSION_DOMAIN.
 */
final class NormalizeSessionCookieDomain
{
    public function handle(Request $request, Closure $next): Response
    {
        $configuredDomain = config('session.domain');

        if (! is_string($configuredDomain) || $configuredDomain === '') {
            return $next($request);
        }

        $host = strtolower($request->getHost());
        $normalizedDomain = strtolower(ltrim($configuredDomain, '.'));

        $compatible = $host === $normalizedDomain
            || str_ends_with($host, '.'.$normalizedDomain);

        if (! $compatible) {
            config(['session.domain' => null]);
        }

        return $next($request);
    }
}
