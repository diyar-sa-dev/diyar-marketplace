<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\UpdateVendorShippingSettingsRequest;
use App\Http\Resources\VendorShippingSettingsResource;
use App\Models\VendorShippingSettings;
use App\Services\Shipping\VendorShippingSettingsService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorShippingSettingsController extends Controller
{
    public function __construct(
        private readonly VendorShippingSettingsService $settings,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $this->authorize('view', VendorShippingSettings::class);

        $model = $this->settings->getForAuthenticatedVendor($request->user());

        return ApiResponse::success(data: [
            'shipping_settings' => $model !== null
                ? new VendorShippingSettingsResource($model)
                : null,
        ]);
    }

    public function update(UpdateVendorShippingSettingsRequest $request): JsonResponse
    {
        $this->authorize('update', VendorShippingSettings::class);

        $model = $this->settings->upsert($request->user(), $request->validated());

        return ApiResponse::success(
            data: ['shipping_settings' => new VendorShippingSettingsResource($model)],
            message: __('diyar.shipping.settings_saved'),
        );
    }
}
