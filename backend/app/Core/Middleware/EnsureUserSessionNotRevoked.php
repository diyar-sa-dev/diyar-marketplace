<?php

namespace App\Core\Middleware;

use App\Domains\Identity\Services\UserSessionService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserSessionNotRevoked
{
    public function __construct(
        private readonly UserSessionService $sessions,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');

        if ($user !== null && $request->hasSession()) {
            if ($this->sessions->isCurrentSessionRevoked($request->session()->getId())) {
                Auth::guard('web')->logout();

                if ($request->hasSession()) {
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                }

                abort(401, __('diyar.profile.security.session_revoked'));
            }
        }

        return $next($request);
    }
}
