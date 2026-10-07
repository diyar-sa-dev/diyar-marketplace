<?php

namespace App\Core\Middleware;

use App\Domains\Identity\Services\UserSessionService;
use App\Domains\Identity\Support\SessionLookupHash;
use App\Models\UserSession;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserSessionActivityMiddleware
{
    public function __construct(
        private readonly UserSessionService $sessions,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        try {
            $user = $request->user('web');

            if ($user === null || ! $request->hasSession()) {
                return $response;
            }

            $sessionId = $request->session()->getId();
            $sessionHash = SessionLookupHash::make($sessionId);

            $tracked = UserSession::query()
                ->where('session_lookup_hash', $sessionHash)
                ->whereNull('revoked_at')
                ->exists();

            if ($tracked) {
                $this->sessions->touchActivity($user, $sessionId);
            } elseif ($this->sessions->shouldAttemptBackfill($sessionId)) {
                $this->sessions->registerFromRequest($user, $request);
            }
        } catch (\Throwable $exception) {
            report($exception);
        }

        return $response;
    }
}
