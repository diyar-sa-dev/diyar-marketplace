<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\LoyaltyTransactionResource;
use App\Models\User;
use App\Services\Loyalty\LoyaltyLedgerService;
use App\Services\Loyalty\LoyaltyQueryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

class AdminLoyaltyController extends Controller
{
    public function __construct(
        private readonly LoyaltyQueryService $loyalty,
        private readonly LoyaltyLedgerService $ledger,
    ) {}

    public function showCustomer(string $userId): JsonResponse
    {
        $user = User::query()->findOrFail($userId);
        $account = $this->loyalty->findAccountForAdmin($userId);

        $summary = $this->loyalty->summaryForUser($user);

        $recent = $account !== null
            ? $account->transactions()->limit(10)->get()
            : collect();

        return ApiResponse::success([
            'customer' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'loyalty' => $summary,
            'recent_transactions' => LoyaltyTransactionResource::collection($recent)->resolve(),
        ]);
    }

    public function adjust(Request $request, string $userId): JsonResponse
    {
        $validated = $request->validate([
            'points' => ['required', 'integer', 'not_in:0', 'min:1', 'max:'.config('diyar.loyalty.max_adjustment_points', 100_000)],
            'direction' => ['required', Rule::in(['credit', 'debit'])],
            'reason' => ['required', 'string', 'min:3', 'max:500'],
        ]);

        /** @var User $admin */
        $admin = $request->user();
        $customer = User::query()->findOrFail($userId);

        $signedPoints = $validated['direction'] === 'credit'
            ? (int) $validated['points']
            : -(int) $validated['points'];

        try {
            $transaction = $this->ledger->adjust(
                customer: $customer,
                admin: $admin,
                signedPoints: $signedPoints,
                reason: $validated['reason'],
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success([
            'transaction' => new LoyaltyTransactionResource($transaction),
            'loyalty' => $this->loyalty->summaryForUser($customer),
        ]);
    }
}
