<?php

namespace App\Http\Middleware;

use App\Support\Api\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRoomDesignerEnabled
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! config('diyar.feature.room_designer_enabled', false)) {
            return ApiResponse::error(__('diyar.room_designer.disabled'), 403);
        }

        return $next($request);
    }
}
