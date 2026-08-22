<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminAffiliateClickResource;
use App\Models\AffiliateClick;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminAffiliateClickController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AffiliateClick::query()->with(['link', 'profile', 'product']);

        if ($profileId = $request->string('affiliate_profile_id')->toString()) {
            $query->where('affiliate_profile_id', $profileId);
        }

        if ($linkId = $request->string('affiliate_link_id')->toString()) {
            $query->where('affiliate_link_id', $linkId);
        }

        if ($request->boolean('converted_only')) {
            $query->whereNotNull('converted_at');
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('affiliate_clicks', AdminAffiliateClickResource::collection($paginator->items()), $paginator);
    }

    public function show(AffiliateClick $affiliateClick): JsonResponse
    {
        $affiliateClick->load(['link', 'profile', 'product']);

        return ApiResponse::success(data: [
            'affiliate_click' => new AdminAffiliateClickResource($affiliateClick),
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
