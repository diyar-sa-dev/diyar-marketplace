<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use App\Support\Api\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureAccountIsActive
{
    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('web');

        if ($user === null) {
            return $next($request);
        }

        if ($request->is('api/v1/auth/me', 'api/v1/auth/logout')) {
            return $next($request);
        }

        if ($user->status === UserStatus::Pending) {
            return ApiResponse::error(
                message: __('account.pending'),
                status: 403,
                errors: ['account_status' => ['pending']],
            );
        }

        if (in_array($user->status, [UserStatus::Suspended, UserStatus::Rejected], true)) {
            return ApiResponse::error(
                message: __('account.suspended'),
                status: 403,
                errors: ['account_status' => [$user->status->value]],
            );
        }

        return $next($request);
    }
}
