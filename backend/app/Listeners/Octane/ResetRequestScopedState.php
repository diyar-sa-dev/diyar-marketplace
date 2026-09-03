<?php

namespace App\Listeners\Octane;

use Laravel\Octane\Events\RequestReceived;

/**
 * Resets request-scoped application state that may otherwise leak across Octane requests.
 */
final class ResetRequestScopedState
{
    public function handle(RequestReceived $event): void
    {
        app()->setLocale((string) config('app.locale', 'ar'));

        if (app()->bound('translator')) {
            app('translator')->setLocale(app()->getLocale());
        }
    }
}
