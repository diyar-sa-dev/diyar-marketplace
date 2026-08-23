<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\RejectVendorPayoutRequest;
use App\Http\Resources\Admin\AdminVendorPayoutResource;
use App\Http\Resources\VendorPayoutResource;
use App\Models\User;
use App\Models\VendorPayout;
use App\Services\Admin\AdminPayoutActionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminPayoutController extends Controller
{
    public function __construct(
        private readonly AdminPayoutActionService $payouts,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin('viewAny', VendorPayout::class);

        $payouts = VendorPayout::query()
            ->with(['vendorAccount.user', 'vendorAccount.bankAccounts'])
            ->when($request->query('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->query('q'), function ($query, $term) {
                $like = '%'.$term.'%';
                $query->where(function ($builder) use ($like) {
                    $builder->where('reference', 'like', $like)
                        ->orWhereHas('vendorAccount', fn ($vendor) => $vendor->where('business_name', 'like', $like));
                });
            })
            ->latest('requested_at')
            ->paginate(20);

        return ApiResponse::success([
            'payouts' => AdminVendorPayoutResource::collection(collect($payouts->items())),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ],
        ]);
    }

    public function approve(Request $request, VendorPayout $payout): JsonResponse
    {
        $admin = $this->authorizeAdmin('approve', VendorPayout::class);

        try {
            $updated = $this->payouts->approveVendorPayout($payout, $admin);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new VendorPayoutResource($updated)]);
    }

    public function reject(RejectVendorPayoutRequest $request, VendorPayout $payout): JsonResponse
    {
        $admin = $this->authorizeAdmin('reject', VendorPayout::class);

        try {
            $updated = $this->payouts->rejectVendorPayout($payout, $admin, $request->validated('reason'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new VendorPayoutResource($updated)]);
    }

    public function markPaid(Request $request, VendorPayout $payout): JsonResponse
    {
        $admin = $this->authorizeAdmin('markPaid', VendorPayout::class);

        try {
            $updated = $this->payouts->markVendorPayoutPaid($payout, $admin);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['payout' => new VendorPayoutResource($updated)],
            message: __('diyar.finance.payout_marked_paid'),
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
