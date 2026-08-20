<?php

namespace App\Http\Controllers\Api\V1\Dashboard\Affiliate;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\RequestAffiliatePayoutRequest;
use App\Http\Resources\AffiliatePayoutResource;
use App\Models\AffiliatePayout;
use App\Services\Affiliate\AffiliateBalanceService;
use App\Services\Affiliate\AffiliatePayoutService;
use App\Services\Affiliate\AffiliateProfileService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AffiliatePayoutController extends Controller
{
    public function __construct(
        private readonly AffiliateProfileService $profiles,
        private readonly AffiliateBalanceService $balances,
        private readonly AffiliatePayoutService $payouts,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());
        $this->profiles->assertDashboardAccess($profile);

        $paginator = AffiliatePayout::query()
            ->where('affiliate_profile_id', $profile->id)
            ->latest('requested_at')
            ->paginate(min(max((int) $request->query('per_page', 20), 1), 50));

        return ApiResponse::success(data: [
            'balance' => $this->balances->summary($profile),
            'payouts' => AffiliatePayoutResource::collection($paginator->items()),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(RequestAffiliatePayoutRequest $request): JsonResponse
    {
        $profile = $this->profiles->resolveOrCreateForUser($request->user());

        try {
            $this->profiles->assertDashboardAccess($profile);
            $available = $this->balances->availableBalance($profile);
            $requested = number_format((float) $request->validated('amount'), 2, '.', '');

            if (bccomp($requested, $available, 2) > 0) {
                return ApiResponse::error(__('diyar.affiliate.insufficient_balance'), 422);
            }

            $payout = $this->payouts->request(
                profile: $profile,
                amount: $requested,
                idempotencyKey: $request->header('Idempotency-Key'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            data: ['payout' => new AffiliatePayoutResource($payout)],
            message: __('diyar.affiliate.payout_requested'),
            status: 201,
        );
    }
}
