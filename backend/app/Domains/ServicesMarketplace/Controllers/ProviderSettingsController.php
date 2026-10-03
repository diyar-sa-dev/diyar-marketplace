<?php

namespace App\Domains\ServicesMarketplace\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderAccountSettingsRequest;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderBankAccountRequest;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderNotificationSettingsRequest;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderPasswordSettingsRequest;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderProfileSettingsRequest;
use App\Domains\ServicesMarketplace\Requests\UpdateProviderWorkingHoursRequest;
use App\Domains\ServicesMarketplace\Requests\UploadProviderAvatarRequest;
use App\Domains\ServicesMarketplace\Resources\ProviderSettingsResource;
use App\Domains\ServicesMarketplace\Services\ProviderSettingsService;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use RuntimeException;

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
        } catch (RuntimeException $exception) {
            return ApiResponse::error($exception->getMessage(), 503);
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
