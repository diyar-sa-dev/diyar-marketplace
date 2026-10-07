<?php

namespace App\Domains\Shipping\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Shipping\Requests\UpdateVendorShippingSettingsRequest;
use App\Domains\Shipping\Resources\VendorShippingSettingsResource;
use App\Domains\Shipping\Services\VendorShippingSettingsService;
use App\Http\Controllers\Controller;
use App\Models\VendorShippingSettings;
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
