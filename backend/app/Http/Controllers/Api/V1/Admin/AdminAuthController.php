<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\Identity\AuthService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminAuthController extends Controller
{
    public function __construct(
        private readonly AuthService $auth,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $remember = $request->boolean('remember');
        $user = $request->string('method')->toString() === 'email'
            ? $this->auth->loginForAdminWithEmail(
                email: $request->string('identifier')->toString(),
                password: $request->string('password')->toString(),
                remember: $remember,
            )
            : $this->auth->loginForAdminWithPhone(
                phoneRaw: $request->string('identifier')->toString(),
                password: $request->string('password')->toString(),
                remember: $remember,
            );

        return ApiResponse::success(
            data: ['user' => new UserResource($user)],
            message: __('diyar.auth.login_success'),
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $this->auth->logoutAdmin();

        return ApiResponse::success(message: __('diyar.auth.logout_success'));
    }
}
