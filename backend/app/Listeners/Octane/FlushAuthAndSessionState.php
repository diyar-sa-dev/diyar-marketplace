<?php

namespace App\Listeners\Octane;

use Illuminate\Contracts\Container\Container;
use Illuminate\Support\Facades\Auth;
use Laravel\Octane\Events\RequestReceived;

/**
 * Ensures Auth guards and session stores cached in memory across Octane worker
 * requests are explicitly wiped so no session leakage can ever occur between requests.
 *
 * Important: never call forgetInstance('session') here. StartSession keeps a reference
 * to the SessionManager singleton for the worker lifetime; forgetting the binding
 * causes the next session.store resolve to create a second manager/driver pair while
 * StartSession continues using the original manager — auth guards then read a different
 * session store than the one populated from the request cookie.
 */
final class FlushAuthAndSessionState
{
    public function __construct(private readonly Container $app) {}

    public function handle(RequestReceived $event): void
    {
        Auth::forgetGuards();

        foreach (['auth.driver', 'auth'] as $binding) {
            if ($this->app->bound($binding)) {
                $this->app->forgetInstance($binding);
            }
        }

        if ($this->app->bound('session')) {
            $this->app->make('session')->forgetDrivers();
        }

        if ($this->app->bound('session.store')) {
            $this->app->forgetInstance('session.store');
        }

        if (isset($event->request)) {
            $this->clearRequestSession($event->request);
            $event->request->setUserResolver(fn (?string $guard = null) => Auth::guard($guard)->user());
        }
    }

    /**
     * Octane clones the previous Illuminate request for each worker request and copies
     * the prior session instance onto the new request. StartSession then skips loading
     * the cookie session id, so a later login can regenerate/delete another user's session.
     */
    private function clearRequestSession(object $request): void
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
}
