<?php

namespace App\Http\Controllers\Api\V1\ServiceMarketplace;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceMarketplace\UpdateProviderAccountSettingsRequest;
use App\Http\Requests\ServiceMarketplace\UpdateProviderBankAccountRequest;
use App\Http\Requests\ServiceMarketplace\UpdateProviderNotificationSettingsRequest;
use App\Http\Requests\ServiceMarketplace\UpdateProviderPasswordSettingsRequest;
use App\Http\Requests\ServiceMarketplace\UpdateProviderProfileSettingsRequest;
use App\Http\Requests\ServiceMarketplace\UpdateProviderWorkingHoursRequest;
use App\Http\Requests\ServiceMarketplace\UploadProviderAvatarRequest;
use App\Http\Resources\ProviderSettingsResource;
use App\Services\ServiceMarketplace\ProviderSettingsService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class ProviderSettingsController extends Controller
{
    public function __construct(
        private readonly ProviderSettingsService $settings,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $payload = $this->settings->getForUser($request->user());

        return ApiResponse::success([
            'settings' => new ProviderSettingsResource($payload),
        ]);
    }

    public function updateProfile(UpdateProviderProfileSettingsRequest $request): JsonResponse
    {
        $payload = $this->settings->updateProfile($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.services.settings.profile_saved'),
        );
    }

    public function updateWorkingHours(UpdateProviderWorkingHoursRequest $request): JsonResponse
    {
        $payload = $this->settings->updateWorkingHours(
            $request->user(),
            $request->validated('hours'),
        );

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.services.settings.working_hours_saved'),
        );
    }

    public function updateAccount(UpdateProviderAccountSettingsRequest $request): JsonResponse
    {
        $payload = $this->settings->updateAccount($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.services.settings.account_saved'),
        );
    }

    public function updatePassword(UpdateProviderPasswordSettingsRequest $request): JsonResponse
    {
        $this->settings->updatePassword(
            $request->user(),
            $request->string('current_password')->toString(),
            $request->string('new_password')->toString(),
        );

        return ApiResponse::success(message: __('diyar.profile.password_updated'));
    }

    public function updateNotifications(UpdateProviderNotificationSettingsRequest $request): JsonResponse
    {
        $payload = $this->settings->updateNotifications($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.services.settings.notifications_saved'),
        );
    }

    public function updateBankAccount(UpdateProviderBankAccountRequest $request): JsonResponse
    {
        $payload = $this->settings->upsertBankAccount($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.vendor.bank_saved'),
        );
    }

    public function uploadAvatar(UploadProviderAvatarRequest $request): JsonResponse
    {
        try {
            $payload = $this->settings->uploadAvatar($request->user(), $request->file('avatar'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.services.settings.avatar_updated'),
        );
    }

    public function deleteAvatar(Request $request): JsonResponse
    {
        $payload = $this->settings->deleteAvatar($request->user());

        return ApiResponse::success(
            ['settings' => new ProviderSettingsResource($payload)],
            message: __('diyar.services.settings.avatar_deleted'),
        );
    }
}
