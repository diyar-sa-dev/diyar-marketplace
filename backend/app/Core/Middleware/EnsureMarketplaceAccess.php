<?php

namespace App\Core\Middleware;

use App\Domains\Identity\Support\MarketplaceAccess;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureMarketplaceAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user('web');

        if ($user !== null && ! MarketplaceAccess::canAccessMarketplace($user)) {
            abort(403, __('diyar.auth.admin_use_operations_panel'));
        }

        return $next($request);
    }
}
