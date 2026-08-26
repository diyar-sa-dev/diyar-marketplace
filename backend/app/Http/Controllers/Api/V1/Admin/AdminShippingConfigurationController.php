<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingCarrier;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Services\Admin\AdminShippingConfigurationService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminShippingConfigurationController extends Controller
{
    public function __construct(
        private readonly AdminShippingConfigurationService $shipping,
    ) {}

    public function carriers(Request $request): JsonResponse
    {
        $paginator = $this->shipping->listCarriers(
            page: max((int) $request->integer('page', 1), 1),
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return ApiResponse::success(data: [
            'carriers' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function storeCarrier(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        return ApiResponse::success(
            data: ['carrier' => $this->shipping->createCarrier($payload)],
            status: 201,
        );
    }

    public function updateCarrier(Request $request, ShippingCarrier $carrier): JsonResponse
    {
        $payload = $request->validate([
            'code' => ['sometimes', 'string', 'max:64'],
            'name' => ['sometimes', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        return ApiResponse::success(data: [
            'carrier' => $this->shipping->updateCarrier($carrier, $payload),
        ]);
    }

    public function storeZone(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'carrier_id' => ['required', 'uuid', 'exists:shipping_carriers,id'],
            'name' => ['required', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'max:8'],
            'region' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_prefix' => ['nullable', 'string', 'max:16'],
            'priority' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return ApiResponse::success(
            data: ['zone' => $this->shipping->createZone($payload)],
            status: 201,
        );
    }

    public function storeRateRule(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'shipping_method_id' => ['required', 'uuid', 'exists:shipping_methods,id'],
            'zone_id' => ['nullable', 'uuid', 'exists:shipping_zones,id'],
            'vendor_account_id' => ['nullable', 'uuid', 'exists:vendor_accounts,id'],
            'min_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'max_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'min_subtotal' => ['nullable', 'numeric', 'min:0'],
            'max_subtotal' => ['nullable', 'numeric', 'min:0'],
            'rate' => ['required', 'numeric', 'min:0'],
            'handling_fee' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'volumetric_divisor' => ['nullable', 'integer', 'min:1'],
            'delivery_estimate_days' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return ApiResponse::success(
            data: ['rate_rule' => $this->shipping->createRateRule($payload)],
            status: 201,
        );
    }

    public function storeVendorProfile(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'vendor_account_id' => ['required', 'uuid', 'exists:vendor_accounts,id'],
            'shipping_method_id' => ['nullable', 'uuid', 'exists:shipping_methods,id'],
            'name' => ['required', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'volumetric_divisor' => ['nullable', 'integer', 'min:1'],
            'handling_fee' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'delivery_estimate_days' => ['nullable', 'integer', 'min:1'],
        ]);

        return ApiResponse::success(
            data: ['profile' => $this->shipping->createVendorProfile($payload)],
            status: 201,
        );
    }

    public function destroyRateRule(ShippingRateRule $rateRule): JsonResponse
    {
        $rateRule->delete();

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
    }

    public function destroyZone(ShippingZone $zone): JsonResponse
    {
        $zone->delete();

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
    }
}
