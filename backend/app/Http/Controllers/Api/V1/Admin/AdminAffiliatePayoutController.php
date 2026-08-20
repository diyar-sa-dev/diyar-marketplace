<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\RejectAffiliatePayoutRequest;
use App\Http\Resources\AffiliatePayoutResource;
use App\Models\AffiliatePayout;
use App\Services\Affiliate\AffiliateAdminPayoutService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminAffiliatePayoutController extends Controller
{
    public function __construct(
        private readonly AffiliateAdminPayoutService $payouts,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AffiliatePayout::class);

        $payouts = AffiliatePayout::query()
            ->with(['profile.user'])
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->latest('requested_at')
            ->paginate(20);

        return ApiResponse::success([
            'payouts' => AffiliatePayoutResource::collection(collect($payouts->items())),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ],
        ]);
    }

    public function approve(Request $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $this->authorize('approve', AffiliatePayout::class);

        try {
            $updated = $this->payouts->approve($affiliatePayout, $request->user());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new AffiliatePayoutResource($updated)]);
    }

    public function markProcessing(Request $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $this->authorize('markProcessing', AffiliatePayout::class);

        try {
            $updated = $this->payouts->markProcessing($affiliatePayout, $request->user());
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new AffiliatePayoutResource($updated)]);
    }

    public function reject(RejectAffiliatePayoutRequest $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $this->authorize('reject', AffiliatePayout::class);

        try {
            $updated = $this->payouts->reject($affiliatePayout, $request->user(), $request->validated('reason'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new AffiliatePayoutResource($updated)]);
    }

    public function markPaid(Request $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $this->authorize('markPaid', AffiliatePayout::class);

        try {
            $updated = $this->payouts->markPaid(
                $affiliatePayout,
                $request->user(),
                $request->input('payment_reference'),
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['payout' => new AffiliatePayoutResource($updated)],
            message: __('diyar.affiliate.payout_marked_paid'),
        );
    }
}
