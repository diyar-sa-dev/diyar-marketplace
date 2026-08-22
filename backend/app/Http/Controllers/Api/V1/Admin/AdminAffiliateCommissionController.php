<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminAffiliateCommissionResource;
use App\Models\AffiliateCommission;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminAffiliateCommissionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = AffiliateCommission::query()->with(['profile', 'order', 'product']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($profileId = $request->string('affiliate_profile_id')->toString()) {
            $query->where('affiliate_profile_id', $profileId);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('affiliate_commissions', AdminAffiliateCommissionResource::collection($paginator->items()), $paginator);
    }

    public function show(AffiliateCommission $affiliateCommission): JsonResponse
    {
        $affiliateCommission->load(['profile', 'link', 'order', 'product', 'payout']);

        return ApiResponse::success(data: [
            'affiliate_commission' => new AdminAffiliateCommissionResource($affiliateCommission),
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
