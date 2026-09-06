<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensures that long-lived Octane worker memory does NOT leak cached authentication
 * guard state ($guard->user) across requests. Every incoming Octane request begins
 * with a completely clean auth state so session verification reads strictly from
 * the request's own cookies/session.
 *
 * Skipped under PHPUnit and outside Octane so token/session test helpers keep working.
 */
class EnsureCleanAuthState
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($this->shouldResetGuardState()) {
            Auth::forgetGuards();

            if (app()->bound('session')) {
                app('session')->forgetDrivers();
            }

            if (app()->bound('session.store')) {
                app()->forgetInstance('session.store');
            }

            $this->clearRequestSession($request);

            $request->setUserResolver(fn (?string $guard = null) => Auth::guard($guard)->user());
        }

        return $next($request);
    }

    private function clearRequestSession(Request $request): void
    {
        $reflection = new \ReflectionObject($request);

        while ($reflection !== false) {
            if ($reflection->hasProperty('session')) {
                $property = $reflection->getProperty('session');
                $property->setAccessible(true);
                $property->setValue($request, null);

                return;
            }

            $reflection = $reflection->getParentClass();
        }
    }

    private function shouldResetGuardState(): bool
    {
        if (app()->runningUnitTests()) {
            return false;
        }

        return isset($_SERVER['LARAVEL_OCTANE']) && (int) $_SERVER['LARAVEL_OCTANE'] === 1;
    }
}
