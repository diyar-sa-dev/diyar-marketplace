<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\ValidateCsrfToken as Middleware;
use Symfony\Component\HttpFoundation\Cookie;

final class ValidateCsrfToken extends Middleware
{
    protected function newCookie($request, $config)
    {
        $config['domain'] = self::compatibleSessionDomain(
            $request->getHost(),
            $config['domain'] ?? null,
        );

        return new Cookie(
            'XSRF-TOKEN',
            $request->session()->token(),
            $this->availableAt(60 * $config['lifetime']),
            $config['path'],
            $config['domain'],
            $config['secure'],
            false,
            false,
            $config['same_site'] ?? null,
            $config['partitioned'] ?? false,
        );
    }

    public function shouldAddXsrfTokenCookie()
    {
        if ($this->app->runningUnitTests()) {
            return parent::shouldAddXsrfTokenCookie();
        }

        // JSON CSRF contract — token is returned in the response body.
        if (request()->is('api/v1/csrf-token')) {
            return false;
        }

        return parent::shouldAddXsrfTokenCookie();
    }

    public static function compatibleSessionDomain(string $host, mixed $configuredDomain): ?string
    {
        if (! is_string($configuredDomain) || $configuredDomain === '') {
            return null;
        }

        $host = strtolower($host);
        $normalizedDomain = strtolower(ltrim($configuredDomain, '.'));

        if ($host === $normalizedDomain || str_ends_with($host, '.'.$normalizedDomain)) {
            return $configuredDomain;
        }

        return null;
    }
}
