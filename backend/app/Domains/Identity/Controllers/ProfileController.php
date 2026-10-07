<?php

namespace App\Domains\Identity\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Identity\Requests\RequestPhoneChangeRequest;
use App\Domains\Identity\Requests\UpdateProfilePasswordRequest;
use App\Domains\Identity\Requests\UpdateProfileRequest;
use App\Domains\Identity\Requests\UploadAvatarRequest;
use App\Domains\Identity\Requests\VerifyEmailVerificationRequest;
use App\Domains\Identity\Requests\VerifyPhoneChangeRequest;
use App\Domains\Identity\Resources\ProfileResource;
use App\Domains\Identity\Services\EmailVerificationService;
use App\Domains\Identity\Services\PhoneChangeService;
use App\Domains\Identity\Services\ProfileService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profile,
        private readonly PhoneChangeService $phoneChange,
        private readonly EmailVerificationService $emailVerification,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->load('roles');

        return ApiResponse::success(data: [
            'profile' => new ProfileResource($user),
        ]);
    }

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $this->profile->update(
            user: $request->user(),
            attributes: $request->validated(),
        );

        return ApiResponse::success(
            data: ['profile' => new ProfileResource($user)],
            message: __('diyar.profile.updated'),
        );
    }

    public function updatePassword(UpdateProfilePasswordRequest $request): JsonResponse
    {
        $this->profile->updatePassword(
            user: $request->user(),
            currentPassword: $request->string('current_password')->toString(),
            newPassword: $request->string('new_password')->toString(),
        );

        return ApiResponse::success(message: __('diyar.profile.password_updated'));
    }

    public function uploadAvatar(UploadAvatarRequest $request): JsonResponse
    {
        try {
            $user = $this->profile->uploadAvatar(
                user: $request->user(),
                file: $request->file('avatar'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 503);
        }

        return ApiResponse::success(
            data: ['profile' => new ProfileResource($user)],
            message: __('diyar.profile.avatar_updated'),
        );
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $user = $this->profile->deleteAvatar($request->user());

        return ApiResponse::success(
            data: ['profile' => new ProfileResource($user)],
            message: __('diyar.profile.avatar_deleted'),
        );
    }

    public function requestPhoneChange(RequestPhoneChangeRequest $request): JsonResponse
    {
        $this->phoneChange->requestChange(
            user: $request->user(),
            newPhoneRaw: $request->string('phone')->toString(),
        );

        return ApiResponse::success(message: __('diyar.profile.phone_change_otp_sent'));
    }

    public function resendPhoneChange(RequestPhoneChangeRequest $request): JsonResponse
    {
        $this->phoneChange->resendChange(
            user: $request->user(),
            newPhoneRaw: $request->string('phone')->toString(),
        );

        return ApiResponse::success(message: __('diyar.profile.phone_change_otp_resent'));
    }

    public function verifyPhoneChange(VerifyPhoneChangeRequest $request): JsonResponse
    {
        $user = $this->phoneChange->verifyAndApply(
            user: $request->user(),
            newPhoneRaw: $request->string('phone')->toString(),
            code: $request->string('code')->toString(),
        );

        return ApiResponse::success(
            data: ['profile' => new ProfileResource($user)],
            message: __('diyar.profile.phone_changed'),
        );
    }

    public function requestEmailVerification(Request $request): JsonResponse
    {
        $this->emailVerification->requestForUser(
            user: $request->user(),
            locale: app()->getLocale(),
        );

        return ApiResponse::success(message: __('diyar.profile.email_verification_sent'));
    }

    public function resendEmailVerification(Request $request): JsonResponse
    {
        $this->emailVerification->resendForUser(
            user: $request->user(),
            locale: app()->getLocale(),
        );

        return ApiResponse::success(message: __('diyar.profile.email_verification_resent'));
    }

    public function verifyEmailVerification(VerifyEmailVerificationRequest $request): JsonResponse
    {
        $user = $this->emailVerification->verifyForUser(
            user: $request->user(),
            code: $request->string('code')->toString(),
        );

        return ApiResponse::success(
            data: ['profile' => new ProfileResource($user)],
            message: __('diyar.auth.email_verified'),
        );
    }
}
