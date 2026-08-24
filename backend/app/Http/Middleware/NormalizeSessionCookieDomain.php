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
        config([
            'session.domain' => ValidateCsrfToken::compatibleSessionDomain(
                $request->getHost(),
                config('session.domain'),
            ),
        ]);

        return $next($request);
    }
}
