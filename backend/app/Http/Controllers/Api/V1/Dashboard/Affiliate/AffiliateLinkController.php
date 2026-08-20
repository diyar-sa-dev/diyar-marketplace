<?php

namespace App\Http\Controllers\Api\V1\Dashboard\Affiliate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\CreateAffiliateLinkRequest;
use App\Http\Resources\AffiliateLinkResource;
use App\Models\AffiliateLink;
use App\Services\Affiliate\AffiliateDashboardService;
use App\Services\Affiliate\AffiliateLinkService;
use App\Services\Affiliate\AffiliateProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AffiliateLinkController extends Controller
{
    public function __construct(
        private readonly AffiliateProfileService $profiles,
        private readonly AffiliateLinkService $links,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());
        $this->profiles->assertDashboardAccess($profile);
        $paginator = $this->links->listForProfile($profile, (int) $request->query('per_page', 20));

        $items = collect($paginator->items())->map(function (AffiliateLink $link) {
            $link->setAttribute('public_url', $this->links->buildPublicUrl($link));

            return $link;
        });

        return ApiResponse::success(data: [
            'links' => AffiliateLinkResource::collection($items),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(CreateAffiliateLinkRequest $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());

        try {
            $this->profiles->assertCanCreateLinks($profile);
            $link = $this->links->create($profile, $request->validated());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        AffiliateDashboardService::bustDashboardCache($profile);

        $link->load('product');
        $link->setAttribute('public_url', $this->links->buildPublicUrl($link));

        return ApiResponse::success(
            data: ['link' => new AffiliateLinkResource($link)],
            message: __('diyar.affiliate.link_created'),
            status: 201,
        );
    }

    public function deactivate(Request $request, AffiliateLink $link): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());

        try {
            $updated = $this->links->deactivate($profile, $link);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        AffiliateDashboardService::bustDashboardCache($profile);

        return ApiResponse::success(
            data: ['link' => new AffiliateLinkResource($updated)],
            message: __('diyar.affiliate.link_deactivated'),
        );
    }
}
