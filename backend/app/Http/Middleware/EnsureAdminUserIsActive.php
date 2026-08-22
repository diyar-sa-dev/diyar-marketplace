<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdminUserIsActive
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('admin');

        if ($user !== null && ! $user->isActive()) {
            auth('admin')->logout();

            if ($request->hasSession()) {
                $request->session()->regenerateToken();
            }

            abort(403);
        }

        if ($user !== null && $user->status === UserStatus::Pending) {
            abort(403);
        }

        return $next($request);
    }
}
