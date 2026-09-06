<?php

namespace App\Listeners\Octane;

use Laravel\Octane\Contracts\OperationTerminated;
use Laravel\Octane\Events\RequestTerminated;

/**
 * Ensures Redis/file sessions are persisted at the end of each Octane request.
 */
final class PersistApplicationSession
{
    public function handle(RequestTerminated|OperationTerminated $event): void
    {
        if (! method_exists($event, 'request')) {
            return;
        }

        $request = $event->request;

        if (! $request->hasSession()) {
            return;
        }

        $session = $request->session();

        if ($session->isStarted()) {
            $session->save();
        }
    }
}
