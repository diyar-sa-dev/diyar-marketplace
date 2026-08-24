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
     * Stateful when same-origin (Vercel proxy) OR when Origin is a configured Sanctum SPA domain
     * (direct cross-origin API — requires SESSION_SAME_SITE=none on Render).
     */
    public static function fromFrontend($request)
    {
        if (! parent::fromFrontend($request)) {
            return false;
        }

        if (self::originMatchesApplicationHost($request)) {
            return true;
        }

        return self::originIsSanctumStatefulDomain($request);
    }

    public static function originMatchesApplicationHost(Request $request): bool
    {
        $originHost = self::originHost($request);

        if ($originHost === null) {
            return false;
        }

        return strcasecmp($originHost, $request->getHost()) === 0;
    }

    public static function originIsSanctumStatefulDomain(Request $request): bool
    {
        $originHost = self::originHost($request);

        if ($originHost === null) {
            return false;
        }

        foreach (config('sanctum.stateful', []) as $domain) {
            if (! is_string($domain)) {
                continue;
            }

            $domain = trim($domain);

            if ($domain !== '' && strcasecmp($originHost, $domain) === 0) {
                return true;
            }
        }

        return false;
    }

    private static function originHost(Request $request): ?string
    {
        $origin = $request->headers->get('origin') ?: $request->headers->get('referer');

        if (! is_string($origin) || $origin === '') {
            return null;
        }

        $originHost = parse_url($origin, PHP_URL_HOST);

        if (! is_string($originHost) || $originHost === '') {
            return null;
        }

        return $originHost;
    }
}
