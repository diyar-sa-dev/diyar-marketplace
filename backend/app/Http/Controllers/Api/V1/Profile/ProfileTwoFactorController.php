<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\ConfirmTwoFactorRequest;
use App\Http\Requests\Profile\DisableTwoFactorRequest;
use App\Http\Resources\UserResource;
use App\Services\Security\TwoFactorService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileTwoFactorController extends Controller
{
    public function __construct(
        private readonly TwoFactorService $twoFactor,
    ) {}

    public function show(Request $request): JsonResponse
    {
        return ApiResponse::success(
            data: $this->twoFactor->status($request->user()),
        );
    }

    public function enable(Request $request): JsonResponse
    {
        $this->twoFactor->beginEnrollment($request->user());

        return ApiResponse::success(message: __('diyar.two_factor.setup_started'));
    }

    public function confirm(ConfirmTwoFactorRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->twoFactor->confirmEnrollment($user, $request->string('code')->toString());

        return ApiResponse::success(
            data: [
                'two_factor' => $this->twoFactor->status($user->fresh()),
                'user' => new UserResource($user->fresh()->load('roles')),
            ],
            message: __('diyar.two_factor.enabled'),
        );
    }

    public function disable(DisableTwoFactorRequest $request): JsonResponse
    {
        $user = $request->user();
        $password = $request->string('password')->toString();
        $code = $request->input('code');

        if ($code === null || $code === '') {
            $this->twoFactor->beginDisable($user, $password);

            return ApiResponse::success(message: __('diyar.two_factor.disable_started'));
        }

        if (! Hash::check($password, (string) $user->password)) {
            throw ValidationException::withMessages([
                'password' => [__('diyar.two_factor.invalid_password')],
            ]);
        }

        $this->twoFactor->confirmDisable($user, (string) $code);

        return ApiResponse::success(
            data: [
                'two_factor' => $this->twoFactor->status($user->fresh()),
                'user' => new UserResource($user->fresh()->load('roles')),
            ],
            message: __('diyar.two_factor.disabled'),
        );
    }
}
