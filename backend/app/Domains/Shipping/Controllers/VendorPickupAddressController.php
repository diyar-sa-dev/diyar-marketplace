<?php

namespace App\Domains\Shipping\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Shipping\Services\CarrierGatewayManager;
use App\Domains\Vendors\Services\VendorAccessService;
use App\Http\Controllers\Controller;
use App\Models\VendorOrder;
use App\Models\VendorPickupAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class VendorPickupAddressController extends Controller
{
    public function __construct(
        private readonly VendorAccessService $access,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertPermission($request->user(), 'orders');

        $addresses = VendorPickupAddress::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->orderByDesc('is_default')
            ->get();

        return ApiResponse::success(data: ['addresses' => $addresses]);
    }

    public function store(Request $request): JsonResponse
    {
        $vendorAccount = $this->access->assertWritePermission($request->user(), 'orders');

        $validated = $request->validate([
            'contact_name' => ['required', 'string', 'max:128'],
            'contact_phone' => ['required', 'string', 'max:32'],
            'city' => ['required', 'string', 'max:64'],
            'district' => ['nullable', 'string', 'max:64'],
            'street' => ['nullable', 'string', 'max:128'],
            'building_number' => ['nullable', 'string', 'max:16'],
            'postal_code' => ['nullable', 'string', 'max:16'],
            'national_short_address' => ['nullable', 'string', 'max:16'],
            'is_default' => ['boolean'],
        ]);

        if (! empty($validated['is_default'])) {
            VendorPickupAddress::query()
                ->where('vendor_account_id', $vendorAccount->id)
                ->update(['is_default' => false]);
        }

        $address = VendorPickupAddress::query()->create([
            'vendor_account_id' => $vendorAccount->id,
            ...$validated,
        ]);

        return ApiResponse::success(
            data: ['address' => $address],
            message: 'Vendor pickup address created successfully',
            status: 201
        );
    }

    public function downloadLabel(Request $request, VendorOrder $vendorOrder, CarrierGatewayManager $gatewayManager): Response
    {
        $this->authorize('view', $vendorOrder);

        $carrierShipment = $vendorOrder->shipment?->carrierShipment;
        if (! $carrierShipment || empty($carrierShipment->external_shipment_id)) {
            abort(404, 'Shipping label not available for this order');
        }

        $gateway = $gatewayManager->resolve($carrierShipment->carrier_code);
        $binary = $gateway->getLabel($carrierShipment->external_shipment_id);

        return response($binary, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="awb-'.$carrierShipment->tracking_number.'.pdf"',
        ]);
    }
}
