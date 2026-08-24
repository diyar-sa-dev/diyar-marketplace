<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumEnsureFrontendRequestsAreStateful;

final class EnsureFrontendRequestsAreStateful extends SanctumEnsureFrontendRequestsAreStateful
{
    /**
     * Vercel same-origin proxy: keep Sanctum's secure defaults (SameSite=lax).
     */
    protected function configureSecureCookieSessions(): void
    {
        parent::configureSecureCookieSessions();
    }

    /**
     * Only treat requests as stateful when the SPA Origin matches the app host.
     * Prevents Render (*.onrender.com) from crashing when Origin is the Vercel domain.
     */
    public static function fromFrontend($request)
    {
        if (! parent::fromFrontend($request)) {
            return false;
        }

        return self::originMatchesApplicationHost($request);
    }

    public static function originMatchesApplicationHost(Request $request): bool
    {
        $origin = $request->headers->get('origin') ?: $request->headers->get('referer');

        if (! is_string($origin) || $origin === '') {
            return false;
        }

        $originHost = parse_url($origin, PHP_URL_HOST);

        if (! is_string($originHost) || $originHost === '') {
            return false;
        }

        return strcasecmp($originHost, $request->getHost()) === 0;
    }
}
