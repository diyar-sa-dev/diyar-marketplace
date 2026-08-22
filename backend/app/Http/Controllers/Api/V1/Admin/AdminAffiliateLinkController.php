<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AffiliateLinkResource;
use App\Models\AffiliateLink;
use App\Services\Admin\AdminAffiliateLinkService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminAffiliateLinkController extends Controller
{
    public function __construct(
        private readonly AdminAffiliateLinkService $links,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = AffiliateLink::query()->with(['profile', 'product']);

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($profileId = $request->string('affiliate_profile_id')->toString()) {
            $query->where('affiliate_profile_id', $profileId);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('referral_code', 'like', "%{$search}%")
                    ->orWhere('name', 'like', "%{$search}%")
                    ->orWhere('campaign_name', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('affiliate_links', AffiliateLinkResource::collection($paginator->items()), $paginator);
    }

    public function show(AffiliateLink $affiliateLink): JsonResponse
    {
        $affiliateLink->load(['profile', 'product']);

        return ApiResponse::success(data: [
            'affiliate_link' => new AffiliateLinkResource($affiliateLink),
        ]);
    }

    public function disable(Request $request, AffiliateLink $affiliateLink): JsonResponse
    {
        $updated = $this->links->disable(
            link: $affiliateLink,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['affiliate_link' => new AffiliateLinkResource($updated)]);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
