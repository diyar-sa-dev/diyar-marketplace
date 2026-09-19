<?php

namespace App\Http\Middleware;

use App\Support\Api\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTryInRoomEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('diyar.feature.try_in_room_enabled', false)) {
            return ApiResponse::error(__('diyar.try_in_room.disabled'), 403);
        }

        return $next($request);
    }
}
