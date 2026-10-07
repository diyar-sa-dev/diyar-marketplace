<?php

namespace App\Domains\Vendors\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Vendors\Requests\UpdateVendorBankAccountRequest;
use App\Domains\Vendors\Requests\UpdateVendorLegalProfileRequest;
use App\Domains\Vendors\Requests\UpdateVendorSettingsRequest;
use App\Domains\Vendors\Requests\UpdateVendorWorkingHoursRequest;
use App\Domains\Vendors\Requests\UploadVendorCoverRequest;
use App\Domains\Vendors\Requests\UploadVendorLogoRequest;
use App\Domains\Vendors\Resources\VendorSettingsResource;
use App\Domains\Vendors\Services\VendorSettingsService;
use App\Http\Controllers\Controller;
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
