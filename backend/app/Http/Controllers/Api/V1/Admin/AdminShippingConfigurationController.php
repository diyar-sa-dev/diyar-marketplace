<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShippingCarrier;
use App\Models\ShippingMethod;
use App\Models\ShippingRateRule;
use App\Models\ShippingZone;
use App\Models\VendorShippingProfile;
use App\Services\Admin\AdminShippingConfigurationService;
use App\Support\Api\ApiResponse;
use App\Support\SlugGenerator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

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
            search: $this->searchTerm($request),
        );

        return $this->paginated('carriers', $paginator);
    }

    public function zones(Request $request): JsonResponse
    {
        $carrierId = $request->string('carrier_id')->toString();
        $paginator = $this->shipping->listZones(
            page: max((int) $request->integer('page', 1), 1),
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
            carrierId: $carrierId !== '' ? $carrierId : null,
            search: $this->searchTerm($request),
        );

        return $this->paginated('zones', $paginator);
    }

    public function methods(Request $request): JsonResponse
    {
        $carrierId = $request->string('carrier_id')->toString();
        $paginator = $this->shipping->listMethods(
            page: max((int) $request->integer('page', 1), 1),
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
            carrierId: $carrierId !== '' ? $carrierId : null,
            search: $this->searchTerm($request),
        );

        return $this->paginated('methods', $paginator);
    }

    public function rateRules(Request $request): JsonResponse
    {
        $methodId = $request->string('shipping_method_id')->toString();
        $paginator = $this->shipping->listRateRules(
            page: max((int) $request->integer('page', 1), 1),
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
            methodId: $methodId !== '' ? $methodId : null,
            search: $this->searchTerm($request),
        );

        return $this->paginated('rate_rules', $paginator);
    }

    public function vendorProfiles(Request $request): JsonResponse
    {
        $vendorId = $request->string('vendor_account_id')->toString();
        $paginator = $this->shipping->listVendorProfiles(
            page: max((int) $request->integer('page', 1), 1),
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
            vendorAccountId: $vendorId !== '' ? $vendorId : null,
        );

        return $this->paginated('profiles', $paginator);
    }

    public function storeCarrier(Request $request): JsonResponse
    {
        $explicitCode = $request->exists('code') && trim((string) $request->input('code', '')) !== '';
        $this->slugifyCode($request, generateIfMissing: true);

        $payload = $request->validate([
            'code' => ['required', 'string', 'max:64', 'alpha_dash', 'unique:shipping_carriers,code'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        if (! $explicitCode) {
            $payload['code'] = SlugGenerator::unique($payload['code'], new ShippingCarrier, 'code');
        }

        return ApiResponse::success(
            data: ['carrier' => $this->shipping->createCarrier($payload)],
            status: 201,
        );
    }

    public function updateCarrier(Request $request, ShippingCarrier $carrier): JsonResponse
    {
        $this->slugifyCode($request);

        $payload = $request->validate([
            'code' => ['sometimes', 'required', 'string', 'max:64', 'alpha_dash', Rule::unique('shipping_carriers', 'code')->ignore($carrier->id)],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        return ApiResponse::success(data: [
            'carrier' => $this->shipping->updateCarrier($carrier, $payload),
        ]);
    }

    public function destroyCarrier(ShippingCarrier $carrier): JsonResponse
    {
        $this->shipping->deleteCarrier($carrier);

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
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

    public function updateZone(Request $request, ShippingZone $zone): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'country_code' => ['nullable', 'string', 'max:8'],
            'region' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'postal_prefix' => ['nullable', 'string', 'max:16'],
            'priority' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return ApiResponse::success(data: [
            'zone' => $this->shipping->updateZone($zone, $payload),
        ]);
    }

    public function destroyZone(ShippingZone $zone): JsonResponse
    {
        $this->shipping->deleteZone($zone);

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
    }

    public function storeMethod(Request $request): JsonResponse
    {
        $explicitCode = $request->exists('code') && trim((string) $request->input('code', '')) !== '';
        $this->slugifyCode($request, generateIfMissing: true);

        $payload = $request->validate([
            'carrier_id' => ['required', 'uuid', 'exists:shipping_carriers,id'],
            'code' => [
                'required',
                'string',
                'max:64',
                'alpha_dash',
                Rule::unique('shipping_methods', 'code')->where(
                    fn ($query) => $query->where('carrier_id', $request->input('carrier_id')),
                ),
            ],
            'name' => ['required', 'string', 'max:255'],
            'method_type' => ['sometimes', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        if (! $explicitCode) {
            $payload['code'] = SlugGenerator::unique(
                $payload['code'],
                new ShippingMethod,
                'code',
                'carrier_id',
                $payload['carrier_id'],
            );
        }

        return ApiResponse::success(
            data: ['method' => $this->shipping->createMethod($payload)],
            status: 201,
        );
    }

    public function updateMethod(Request $request, ShippingMethod $method): JsonResponse
    {
        $this->slugifyCode($request);

        $payload = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:64',
                'alpha_dash',
                Rule::unique('shipping_methods', 'code')
                    ->where(fn ($query) => $query->where('carrier_id', $method->carrier_id))
                    ->ignore($method->id),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'method_type' => ['sometimes', 'string', 'max:32'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return ApiResponse::success(data: [
            'method' => $this->shipping->updateMethod($method, $payload),
        ]);
    }

    public function destroyMethod(ShippingMethod $method): JsonResponse
    {
        $this->shipping->deleteMethod($method);

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
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

    public function updateRateRule(Request $request, ShippingRateRule $rateRule): JsonResponse
    {
        $payload = $request->validate([
            'zone_id' => ['nullable', 'uuid', 'exists:shipping_zones,id'],
            'vendor_account_id' => ['nullable', 'uuid', 'exists:vendor_accounts,id'],
            'min_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'max_weight_kg' => ['nullable', 'numeric', 'min:0'],
            'min_subtotal' => ['nullable', 'numeric', 'min:0'],
            'max_subtotal' => ['nullable', 'numeric', 'min:0'],
            'rate' => ['sometimes', 'numeric', 'min:0'],
            'handling_fee' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'volumetric_divisor' => ['nullable', 'integer', 'min:1'],
            'delivery_estimate_days' => ['nullable', 'integer', 'min:1'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        return ApiResponse::success(data: [
            'rate_rule' => $this->shipping->updateRateRule($rateRule, $payload),
        ]);
    }

    public function destroyRateRule(ShippingRateRule $rateRule): JsonResponse
    {
        $this->shipping->deleteRateRule($rateRule);

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
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

    public function updateVendorProfile(Request $request, VendorShippingProfile $profile): JsonResponse
    {
        $payload = $request->validate([
            'shipping_method_id' => ['nullable', 'uuid', 'exists:shipping_methods,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'is_default' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
            'volumetric_divisor' => ['nullable', 'integer', 'min:1'],
            'handling_fee' => ['nullable', 'numeric', 'min:0'],
            'free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'delivery_estimate_days' => ['nullable', 'integer', 'min:1'],
        ]);

        return ApiResponse::success(data: [
            'profile' => $this->shipping->updateVendorProfile($profile, $payload),
        ]);
    }

    public function destroyVendorProfile(VendorShippingProfile $profile): JsonResponse
    {
        $this->shipping->deleteVendorProfile($profile);

        return ApiResponse::success(message: __('diyar.shipping.settings_saved'));
    }

    private function searchTerm(Request $request): ?string
    {
        $term = trim($request->string('q')->toString());

        return $term !== '' ? $term : null;
    }

    private function slugifyCode(Request $request, bool $generateIfMissing = false): void
    {
        if (! $generateIfMissing && ! $request->exists('code')) {
            return;
        }

        $source = trim((string) $request->input('code', ''));
        if ($source === '') {
            $source = trim((string) $request->input('name', ''));
        }

        $slug = Str::slug($source);
        if ($slug === '') {
            $slug = 'c'.strtolower(Str::random(8));
        }

        $request->merge([
            'code' => $slug,
        ]);
    }

    private function paginated(string $key, $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
