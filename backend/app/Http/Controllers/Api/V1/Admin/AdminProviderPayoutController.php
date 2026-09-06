<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\RejectVendorPayoutRequest;
use App\Http\Resources\Admin\AdminProviderPayoutResource;
use App\Http\Resources\ProviderPayoutResource;
use App\Models\ProviderPayout;
use App\Models\User;
use App\Services\Admin\AdminPayoutActionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminProviderPayoutController extends Controller
{
    public function __construct(
        private readonly AdminPayoutActionService $payouts,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin('viewAny', ProviderPayout::class);

        $payouts = ProviderPayout::query()
            ->with(['providerAccount.user', 'bankAccount'])
            ->when($request->query('status'), fn ($query, $status) => $query->where('status', $status))
            ->when($request->query('q'), function ($query, $term) {
                $like = '%'.$term.'%';
                $query->where(function ($builder) use ($like) {
                    $builder->where('reference', 'like', $like)
                        ->orWhereHas('providerAccount', fn ($provider) => $provider->where('business_name', 'like', $like));
                });
            })
            ->latest('requested_at')
            ->paginate(20);

        return ApiResponse::success([
            'payouts' => AdminProviderPayoutResource::collection(collect($payouts->items())),
            'pagination' => [
                'current_page' => $payouts->currentPage(),
                'last_page' => $payouts->lastPage(),
                'per_page' => $payouts->perPage(),
                'total' => $payouts->total(),
            ],
        ]);
    }

    public function approve(Request $request, ProviderPayout $providerPayout): JsonResponse
    {
        $admin = $this->authorizeAdmin('approve', ProviderPayout::class);

        try {
            $updated = $this->payouts->approveProviderPayout($providerPayout, $admin);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new ProviderPayoutResource($updated)]);
    }

    public function reject(RejectVendorPayoutRequest $request, ProviderPayout $providerPayout): JsonResponse
    {
        $admin = $this->authorizeAdmin('reject', ProviderPayout::class);

        try {
            $updated = $this->payouts->rejectProviderPayout($providerPayout, $admin, $request->validated('reason'));
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(['payout' => new ProviderPayoutResource($updated)]);
    }

    public function markPaid(Request $request, ProviderPayout $providerPayout): JsonResponse
    {
        $admin = $this->authorizeAdmin('markPaid', ProviderPayout::class);

        try {
            $updated = $this->payouts->markProviderPayoutPaid($providerPayout, $admin);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['payout' => new ProviderPayoutResource($updated)],
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
