<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AffiliateProfileResource;
use App\Models\AffiliateProfile;
use App\Services\Admin\AdminAffiliateProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminAffiliateProfileController extends Controller
{
    public function __construct(
        private readonly AdminAffiliateProfileService $profiles,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = AffiliateProfile::query()->with('user');

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('display_name', 'like', "%{$search}%")
                    ->orWhere('referral_code', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($user) => $user->where('name', 'like', "%{$search}%"));
            });
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('affiliate_profiles', AffiliateProfileResource::collection($paginator->items()), $paginator);
    }

    public function show(AffiliateProfile $affiliateProfile): JsonResponse
    {
        $affiliateProfile->load(['user', 'links', 'commissions', 'payouts']);

        return ApiResponse::success(data: [
            'affiliate_profile' => new AffiliateProfileResource($affiliateProfile),
        ]);
    }

    public function suspend(Request $request, AffiliateProfile $affiliateProfile): JsonResponse
    {
        $updated = $this->profiles->suspend(
            profile: $affiliateProfile,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['affiliate_profile' => new AffiliateProfileResource($updated)]);
    }

    public function activate(Request $request, AffiliateProfile $affiliateProfile): JsonResponse
    {
        $updated = $this->profiles->activate(
            profile: $affiliateProfile,
            actor: $request->user('admin'),
            reason: $request->string('reason')->toString() ?: null,
        );

        return ApiResponse::success(data: ['affiliate_profile' => new AffiliateProfileResource($updated)]);
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
