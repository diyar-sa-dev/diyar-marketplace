<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResendEmailOtpRequest;
use App\Http\Requests\Auth\ResendOtpRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Requests\Auth\VerifyEmailOtpRequest;
use App\Http\Requests\Auth\VerifyOtpRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\Identity\AuthService;
use App\Services\Identity\EmailVerificationService;
use App\Services\Identity\PasswordResetService;
use App\Services\Identity\RegistrationService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function __construct(
        private readonly RegistrationService $registration,
        private readonly AuthService $auth,
        private readonly PasswordResetService $passwordReset,
        private readonly EmailVerificationService $emailVerification,
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $user = $this->registration->register(
            name: $request->string('name')->toString(),
            phoneRaw: $request->string('phone')->toString(),
            email: $request->input('email'),
            password: $request->string('password')->toString(),
            roleKeys: $request->input('roles', []),
        );

        return ApiResponse::success(
            data: [
                'user' => new UserResource($user),
            ],
            message: __('diyar.auth.register_success'),
            status: 201,
        );
    }

    public function verifyOtp(VerifyOtpRequest $request): JsonResponse
    {
        $user = $this->registration->verifyRegistration(
            phoneRaw: $request->string('phone')->toString(),
            code: $request->string('code')->toString(),
        );

        return ApiResponse::success(
            data: ['user' => new UserResource($user)],
            message: __('diyar.auth.otp_verified'),
        );
    }

    public function resendOtp(ResendOtpRequest $request): JsonResponse
    {
        $this->registration->resendRegistrationOtp($request->string('phone')->toString());

        return ApiResponse::success(message: __('diyar.auth.otp_resent'));
    }

    public function verifyEmailOtp(VerifyEmailOtpRequest $request): JsonResponse
    {
        $user = $this->emailVerification->verifyForLogin(
            email: $request->string('email')->toString(),
            code: $request->string('code')->toString(),
        );

        return ApiResponse::success(
            data: ['user' => new UserResource($user)],
            message: __('diyar.auth.email_verified'),
        );
    }

    public function resendEmailOtp(ResendEmailOtpRequest $request): JsonResponse
    {
        $this->emailVerification->resendForLogin(
            email: $request->string('email')->toString(),
            locale: app()->getLocale(),
        );

        return ApiResponse::success(message: __('diyar.auth.email_otp_resent'));
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $remember = $request->boolean('remember');
        $user = $request->string('method')->toString() === 'email'
            ? $this->auth->loginWithEmail(
                email: $request->string('identifier')->toString(),
                password: $request->string('password')->toString(),
                remember: $remember,
            )
            : $this->auth->loginWithPhone(
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
        $this->auth->logoutMarketplace();

        return ApiResponse::success(message: __('diyar.auth.logout_success'));
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = Auth::guard('web')->user();

        if ($user === null) {
            abort(401);
        }

        $user->load(['roles', 'vendorAccount']);

        return ApiResponse::success(data: ['user' => new UserResource($user)]);
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        $this->passwordReset->requestReset($request->string('phone')->toString());

        return ApiResponse::success(
            message: __('diyar.auth.password_reset_otp_sent'),
        );
    }

    public function verifyPasswordResetOtp(VerifyOtpRequest $request): JsonResponse
    {
        $this->passwordReset->verifyCode(
            phoneRaw: $request->string('phone')->toString(),
            code: $request->string('code')->toString(),
        );

        return ApiResponse::success(message: __('diyar.auth.password_reset_otp_verified'));
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        $this->passwordReset->reset(
            phoneRaw: $request->string('phone')->toString(),
            code: $request->string('code')->toString(),
            password: $request->string('password')->toString(),
        );

        return ApiResponse::success(message: __('diyar.auth.password_reset_success'));
    }
}
