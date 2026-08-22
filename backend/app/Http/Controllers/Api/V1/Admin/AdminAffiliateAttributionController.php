<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminAffiliateAttributionResource;
use App\Models\AffiliateAttribution;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminAffiliateAttributionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AffiliateAttribution::query()->with(['profile', 'link', 'user']);

        if ($profileId = $request->string('affiliate_profile_id')->toString()) {
            $query->where('affiliate_profile_id', $profileId);
        }

        if ($request->boolean('active_only')) {
            $query->where('expires_at', '>', now());
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('affiliate_attributions', AdminAffiliateAttributionResource::collection($paginator->items()), $paginator);
    }

    public function show(AffiliateAttribution $affiliateAttribution): JsonResponse
    {
        $affiliateAttribution->load(['profile', 'link', 'user', 'product']);

        return ApiResponse::success(data: [
            'affiliate_attribution' => new AdminAffiliateAttributionResource($affiliateAttribution),
        ]);
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
