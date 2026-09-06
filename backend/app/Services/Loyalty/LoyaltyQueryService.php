<?php

namespace App\Services\Loyalty;

use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class LoyaltyQueryService
{
    public function __construct(
        private readonly LoyaltyLedgerService $ledger,
        private readonly LoyaltyRuleService $rules,
    ) {}

    /**
     * @return array{
     *   balance: int,
     *   total_earned: int,
     *   total_redeemed: int,
     *   total_reversed: int,
     *   total_adjusted: int,
     *   enabled: bool,
     *   sar_per_point: int,
     *   points_per_unit: int
     * }
     */
    public function summaryForUser(User $user): array
    {
        $account = $this->ledger->findOrCreateAccount($user);

        return [
            'balance' => $account->balance,
            'total_earned' => $account->total_earned,
            'total_redeemed' => $account->total_redeemed,
            'total_reversed' => $account->total_reversed,
            'total_adjusted' => $account->total_adjusted,
            'enabled' => $this->rules->isEnabled(),
            'sar_per_point' => $this->rules->sarPerPoint(),
            'points_per_unit' => $this->rules->pointsPerUnit(),
        ];
    }

    /**
     * @return LengthAwarePaginator<int, LoyaltyTransaction>
     */
    public function paginateTransactionsForUser(
        User $user,
        ?string $type,
        int $page,
        int $perPage,
    ): LengthAwarePaginator {
        $account = $this->ledger->findOrCreateAccount($user);

        $query = LoyaltyTransaction::query()
            ->where('loyalty_account_id', $account->id)
            ->orderByDesc('created_at');

        if ($type !== null && $type !== '' && $type !== 'all') {
            $query->where('type', $type);
        }

        return $query->paginate(perPage: min(max($perPage, 1), 50), page: max($page, 1));
    }

    public function findAccountForAdmin(string $userId): ?LoyaltyAccount
    {
        return LoyaltyAccount::query()
            ->with(['user'])
            ->where('user_id', $userId)
            ->first();
    }
}
