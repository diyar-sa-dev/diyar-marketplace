<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\UpdateVendorBankAccountRequest;
use App\Http\Requests\Dashboard\UpdateVendorLegalProfileRequest;
use App\Http\Requests\Dashboard\UpdateVendorSettingsRequest;
use App\Http\Requests\Dashboard\UpdateVendorWorkingHoursRequest;
use App\Http\Requests\Dashboard\UploadVendorCoverRequest;
use App\Http\Requests\Dashboard\UploadVendorLogoRequest;
use App\Http\Resources\VendorSettingsResource;
use App\Services\Vendor\VendorSettingsService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class VendorSettingsController extends Controller
{
    public function __construct(
        private readonly VendorSettingsService $settings,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('view', $vendorAccount);

        $settings = $this->settings->getForUser($request->user());

        return ApiResponse::success([
            'settings' => new VendorSettingsResource($settings),
        ]);
    }

    public function update(UpdateVendorSettingsRequest $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        $settings = $this->settings->updateProfile($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.settings_saved'),
        );
    }

    public function uploadLogo(UploadVendorLogoRequest $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        try {
            $settings = $this->settings->uploadLogo($request->user(), $request->file('logo'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.logo_updated'),
        );
    }

    public function deleteLogo(Request $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        $settings = $this->settings->deleteLogo($request->user());

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.logo_deleted'),
        );
    }

    public function uploadCover(UploadVendorCoverRequest $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        try {
            $settings = $this->settings->uploadCover($request->user(), $request->file('cover'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.cover_updated'),
        );
    }

    public function deleteCover(Request $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        $settings = $this->settings->deleteCover($request->user());

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.cover_deleted'),
        );
    }

    public function updateLegal(UpdateVendorLegalProfileRequest $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        $settings = $this->settings->upsertLegalProfile($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.legal_saved'),
        );
    }

    public function updateBankAccount(UpdateVendorBankAccountRequest $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        $settings = $this->settings->upsertBankAccount($request->user(), $request->validated());

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.bank_saved'),
        );
    }

    public function updateWorkingHours(UpdateVendorWorkingHoursRequest $request): JsonResponse
    {
        $vendorAccount = $request->user()->vendorAccount;
        $this->authorize('update', $vendorAccount);

        $settings = $this->settings->upsertWorkingHours(
            $request->user(),
            $request->validated('hours'),
        );

        return ApiResponse::success(
            ['settings' => new VendorSettingsResource($settings)],
            message: __('diyar.vendor.working_hours_saved'),
        );
    }
}
