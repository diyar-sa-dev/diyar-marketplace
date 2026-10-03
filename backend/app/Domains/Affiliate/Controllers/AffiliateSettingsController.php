<?php

namespace App\Domains\Affiliate\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Affiliate\Requests\UpdateAffiliateSettingsRequest;
use App\Domains\Affiliate\Resources\AffiliateProfileResource;
use App\Domains\Affiliate\Services\AffiliateProfileService;
use App\Core\Support\Api\ApiResponse;
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
