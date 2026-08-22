<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\UpsertProductAffiliateSettingsRequest;
use App\Http\Resources\ProductAffiliateSettingResource;
use App\Models\Product;
use App\Services\Affiliate\AffiliatePlatformConfigService;
use App\Services\Affiliate\ProductAffiliateSettingsService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class VendorProductAffiliateController extends Controller
{
    public function __construct(
        private readonly ProductAffiliateSettingsService $settings,
        private readonly AffiliatePlatformConfigService $platform,
    ) {}

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $setting = $this->settings->getForProduct($product);

        return ApiResponse::success(data: [
            'affiliate' => $setting !== null
                ? new ProductAffiliateSettingResource($setting->load('product.vendorAccount'))
                : null,
            'platform' => $this->platform->snapshot(),
        ]);
    }

    public function update(UpsertProductAffiliateSettingsRequest $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        try {
            $setting = $this->settings->upsertForVendorProduct(
                user: $request->user(),
                product: $product,
                payload: $request->validated(),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: [
                'affiliate' => new ProductAffiliateSettingResource($setting->load('product.vendorAccount')),
                'platform' => $this->platform->snapshot(),
            ],
            message: __('diyar.affiliate.product_settings_updated'),
        );
    }
}
