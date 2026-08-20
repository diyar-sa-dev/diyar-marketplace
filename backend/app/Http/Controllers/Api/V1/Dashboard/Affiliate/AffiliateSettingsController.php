<?php

namespace App\Http\Controllers\Api\V1\Dashboard\Affiliate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\UpdateAffiliateSettingsRequest;
use App\Http\Resources\AffiliateProfileResource;
use App\Services\Affiliate\AffiliateProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AffiliateSettingsController extends Controller
{
    public function __construct(
        private readonly AffiliateProfileService $profiles,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());

        return ApiResponse::success(data: [
            'profile' => new AffiliateProfileResource($profile),
        ]);
    }

    public function update(UpdateAffiliateSettingsRequest $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());
        $updated = $this->profiles->updateSettings($profile, $request->validated());

        return ApiResponse::success(
            data: ['profile' => new AffiliateProfileResource($updated)],
            message: __('diyar.affiliate.settings_updated'),
        );
    }
}
