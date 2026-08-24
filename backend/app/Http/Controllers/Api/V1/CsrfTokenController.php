<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Cookie;

final class CsrfTokenController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $token = csrf_token();

        return ApiResponse::success([
            'token' => $token,
        ])->withCookie(Cookie::create(
            name: 'XSRF-TOKEN',
            value: $token,
            expire: 0,
            path: '/',
            domain: config('session.domain'),
            secure: (bool) config('session.secure'),
            httpOnly: false,
            raw: false,
            sameSite: config('session.same_site', Cookie::SAMESITE_LAX),
        ));
    }
}
