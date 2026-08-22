<?php

namespace App\Http\Middleware;

use App\Enums\AdminPermission;
use App\Models\User;
use App\Services\Admin\AdminPermissionService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAdminPermission
{
    public function __construct(
        private readonly AdminPermissionService $permissions,
    ) {}

    /**
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        /** @var User|null $user */
        $user = $request->user('admin');

        if ($user === null) {
            abort(401);
        }

        $required = AdminPermission::tryFrom($permission) ?? $permission;

        if (! $this->permissions->has($user, $required)) {
            abort(403, __('diyar.auth.forbidden'));
        }

        return $next($request);
    }
}
