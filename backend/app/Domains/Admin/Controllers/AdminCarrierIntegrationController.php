<?php

namespace App\Domains\Admin\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Http\Controllers\Controller;
use App\Models\CarrierConfiguration;
use App\Models\CarrierShipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminCarrierIntegrationController extends Controller
{
    public function index(): JsonResponse
    {
        $configs = CarrierConfiguration::query()->get();

        return ApiResponse::success(data: ['carrier_configurations' => $configs]);
    }

    public function update(Request $request, string $carrierCode): JsonResponse
    {
        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
            'is_sandbox' => ['boolean'],
            'api_token' => ['nullable', 'string'],
            'account_id' => ['nullable', 'string'],
            'webhook_secret' => ['nullable', 'string'],
        ]);

        $config = CarrierConfiguration::query()->firstOrNew(['carrier_code' => $carrierCode]);
        $config->name = ucfirst($carrierCode).' Carrier';
        $config->is_active = $validated['is_active'];

        if (isset($validated['is_sandbox'])) {
            $config->is_sandbox = $validated['is_sandbox'];
        }

        if (! empty($validated['api_token'])) {
            $config->api_token_encrypted = $validated['api_token'];
        }

        if (! empty($validated['account_id'])) {
            $config->account_id_encrypted = $validated['account_id'];
        }

        if (! empty($validated['webhook_secret'])) {
            $config->webhook_secret_encrypted = $validated['webhook_secret'];
        }

        $config->save();

        return ApiResponse::success(
            data: ['carrier_configuration' => $config],
            message: "Carrier {$carrierCode} updated successfully"
        );
    }

    public function reconciliations(): JsonResponse
    {
        $unknowns = CarrierShipment::query()
            ->where('booking_status', 'unknown_outcome')
            ->with(['shipment.vendorOrder'])
            ->get();

        return ApiResponse::success(data: ['reconciliations_required' => $unknowns]);
    }
}
