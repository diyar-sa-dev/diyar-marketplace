<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasRole
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $requiresAdminGuard = $request->is('api/v1/admin/*')
            || in_array('admin', $roles, true);

        if ($requiresAdminGuard) {
            $user = $request->user('admin');
        } else {
            $user = $request->user('web');

            // Sanctum stateful SPA uses the web guard; token-based tests may only set the default user.
            // Never fall back when an admin-guard session is active — that would cross contexts.
            if ($user === null && $request->user('admin') === null) {
                $user = $request->user();
            }
        }

        if ($user === null) {
            abort(401);
        }

        $user->loadMissing('roles');

        foreach ($roles as $role) {
            if ($user->hasRole($role)) {
                return $next($request);
            }
        }

        abort(403);
    }
}
