<?php

namespace App\Http\Controllers\Api\V1\Identity;

use App\Http\Controllers\Controller;
use App\Models\ProviderAccount;
use App\Models\VendorAccount;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OwnershipController extends Controller
{
    public function showVendorAccount(Request $request, VendorAccount $vendorAccount): JsonResponse
    {
        $this->authorize('view', $vendorAccount);

        return ApiResponse::success(data: [
            'account' => [
                'id' => $vendorAccount->id,
                'business_name' => $vendorAccount->business_name,
                'user_id' => $vendorAccount->user_id,
            ],
        ]);
    }

    public function showProviderAccount(Request $request, ProviderAccount $providerAccount): JsonResponse
    {
        $this->authorize('view', $providerAccount);

        return ApiResponse::success(data: [
            'account' => [
                'id' => $providerAccount->id,
                'business_name' => $providerAccount->business_name,
                'user_id' => $providerAccount->user_id,
            ],
        ]);
    }
}
