<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Affiliate\RejectAffiliatePayoutRequest;
use App\Http\Resources\AffiliatePayoutResource;
use App\Models\AffiliatePayout;
use App\Models\User;
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
        $this->authorizeAdmin('viewAny', AffiliatePayout::class);

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
        $admin = $this->authorizeAdmin('approve', AffiliatePayout::class);

        try {
            $updated = $this->payouts->approve($affiliatePayout, $admin);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new AffiliatePayoutResource($updated)]);
    }

    public function markProcessing(Request $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $admin = $this->authorizeAdmin('markProcessing', AffiliatePayout::class);

        try {
            $updated = $this->payouts->markProcessing($affiliatePayout, $admin);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new AffiliatePayoutResource($updated)]);
    }

    public function reject(RejectAffiliatePayoutRequest $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $admin = $this->authorizeAdmin('reject', AffiliatePayout::class);

        try {
            $updated = $this->payouts->reject($affiliatePayout, $admin, $request->validated('reason'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new AffiliatePayoutResource($updated)]);
    }

    public function markPaid(Request $request, AffiliatePayout $affiliatePayout): JsonResponse
    {
        $admin = $this->authorizeAdmin('markPaid', AffiliatePayout::class);

        try {
            $updated = $this->payouts->markPaid(
                $affiliatePayout,
                $admin,
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

    private function authorizeAdmin(string $ability, string $modelClass): User
    {
        /** @var User|null $admin */
        $admin = request()->user('admin');

        if ($admin === null) {
            abort(401);
        }

        $this->authorizeForUser($admin, $ability, $modelClass);

        return $admin;
    }
}
