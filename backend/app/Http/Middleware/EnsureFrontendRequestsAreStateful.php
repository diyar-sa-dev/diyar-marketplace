<?php

namespace App\Http\Middleware;

use Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful as SanctumEnsureFrontendRequestsAreStateful;

final class EnsureFrontendRequestsAreStateful extends SanctumEnsureFrontendRequestsAreStateful
{
    /**
     * Sanctum defaults to SameSite=lax for "first-party" SPAs.
     * Split hosting (Vercel UI + Render API) requires SESSION_SAME_SITE=none.
     */
    protected function configureSecureCookieSessions(): void
    {
        $sameSite = (string) config('session.same_site', 'lax');
        $secure = filter_var(config('session.secure', app()->environment('production')), FILTER_VALIDATE_BOOL);

        config([
            'session.http_only' => true,
            'session.secure' => $sameSite === 'none' ? true : $secure,
            'session.same_site' => $sameSite === '' ? 'lax' : $sameSite,
        ]);
    }

    protected function frontendMiddleware(): array
    {
        $middleware = parent::frontendMiddleware();

        array_unshift($middleware, NormalizeSessionCookieDomain::class);

        return $middleware;
    }
}
