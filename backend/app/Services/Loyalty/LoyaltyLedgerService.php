<?php

namespace App\Services\Loyalty;

use App\Enums\LoyaltyTransactionType;
use App\Models\LoyaltyAccount;
use App\Models\LoyaltyTransaction;
use App\Models\Order;
use App\Models\ReturnRequest;
use App\Models\User;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class LoyaltyLedgerService
{
    public function __construct(
        private readonly LoyaltyRuleService $rules,
        private readonly LoyaltyEligibleAmountService $eligibleAmounts,
    ) {}

    public function accrueForPaidOrder(Order $order): ?LoyaltyTransaction
    {
        if (! $this->rules->isEnabled()) {
            return null;
        }

        $order->loadMissing('user');

        if ($order->user === null) {
            return null;
        }

        $eligible = $this->eligibleAmounts->forOrder($order);
        $points = $this->rules->calculatePoints($eligible);

        if ($points <= 0) {
            return null;
        }

        return $this->postMutation(
            user: $order->user,
            type: LoyaltyTransactionType::Earn,
            points: $points,
            reference: "earn:order:{$order->id}",
            orderId: $order->id,
            eligibleAmount: $eligible,
            reason: __('diyar.loyalty.reasons.order_earn', ['order_number' => $order->order_number]),
            sourceType: 'order',
            sourceId: $order->id,
            onBalance: fn (LoyaltyAccount $account, int $delta) => [
                'balance' => $account->balance + $delta,
                'total_earned' => $account->total_earned + $delta,
            ],
        );
    }

    public function reverseForRefund(ReturnRequest $returnRequest): ?LoyaltyTransaction
    {
        $returnRequest->loadMissing(['order.user', 'order.payment', 'refund']);

        $order = $returnRequest->order;

        if ($order === null || $order->user === null) {
            return null;
        }

        $earn = LoyaltyTransaction::query()
            ->where('order_id', $order->id)
            ->where('type', LoyaltyTransactionType::Earn)
            ->first();

        if ($earn === null || $earn->points <= 0) {
            return null;
        }

        $refundAmount = $returnRequest->refund?->total_amount;

        if ($refundAmount === null) {
            return null;
        }

        $remainingEarn = $this->remainingReversiblePointsForOrder($order->id, $earn->points);

        if ($remainingEarn <= 0) {
            return null;
        }

        $eligible = $this->eligibleAmounts->forOrder($order);
        $reversalPoints = min(
            $remainingEarn,
            $this->rules->calculateReversalPoints(
                $earn->points,
                $eligible,
                (string) $refundAmount,
            ),
        );

        if ($reversalPoints <= 0) {
            return null;
        }

        return $this->postMutation(
            user: $order->user,
            type: LoyaltyTransactionType::Reversal,
            points: -$reversalPoints,
            reference: "reversal:return:{$returnRequest->id}",
            orderId: $order->id,
            eligibleAmount: (string) $refundAmount,
            reason: __('diyar.loyalty.reasons.order_reversal', ['order_number' => $order->order_number]),
            sourceType: 'return',
            sourceId: $returnRequest->id,
            onBalance: fn (LoyaltyAccount $account, int $delta) => [
                'balance' => $account->balance + $delta,
                'total_reversed' => $account->total_reversed + abs($delta),
            ],
        );
    }

    public function adjust(User $customer, User $admin, int $signedPoints, string $reason): LoyaltyTransaction
    {
        if ($signedPoints === 0) {
            throw new InvalidArgumentException(__('diyar.loyalty.adjustment_zero'));
        }

        $max = $this->rules->maxAdjustmentPoints();
        if (abs($signedPoints) > $max) {
            throw new InvalidArgumentException(__('diyar.loyalty.adjustment_exceeds_max', ['max' => $max]));
        }

        $trimmedReason = trim($reason);

        if ($trimmedReason === '') {
            throw new InvalidArgumentException(__('diyar.loyalty.adjustment_reason_required'));
        }

        return $this->postMutation(
            user: $customer,
            type: LoyaltyTransactionType::Adjust,
            points: $signedPoints,
            reference: 'adjust:'.now()->format('YmdHis').':'.$customer->id.':'.bin2hex(random_bytes(4)),
            orderId: null,
            eligibleAmount: null,
            reason: $trimmedReason,
            sourceType: 'admin_adjustment',
            sourceId: null,
            createdBy: $admin->id,
            onBalance: fn (LoyaltyAccount $account, int $delta) => [
                'balance' => $account->balance + $delta,
                'total_adjusted' => $account->total_adjusted + $delta,
            ],
        );
    }

    public function findOrCreateAccount(User $user): LoyaltyAccount
    {
        return LoyaltyAccount::query()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'balance' => 0,
                'total_earned' => 0,
                'total_redeemed' => 0,
                'total_reversed' => 0,
                'total_adjusted' => 0,
            ],
        );
    }

    private function remainingReversiblePointsForOrder(string $orderId, int $earnedPoints): int
    {
        $alreadyReversed = (int) LoyaltyTransaction::query()
            ->where('order_id', $orderId)
            ->where('type', LoyaltyTransactionType::Reversal)
            ->selectRaw('COALESCE(SUM(ABS(points)), 0) as total')
            ->value('total');

        return max(0, $earnedPoints - $alreadyReversed);
    }

    /**
     * @param  callable(LoyaltyAccount, int): array<string, int>  $onBalance
     */
    private function postMutation(
        User $user,
        LoyaltyTransactionType $type,
        int $points,
        string $reference,
        ?string $orderId,
        ?string $eligibleAmount,
        string $reason,
        ?string $sourceType,
        ?string $sourceId,
        callable $onBalance,
        ?string $createdBy = null,
    ): ?LoyaltyTransaction {
        try {
            return DB::transaction(function () use (
                $user,
                $type,
                $points,
                $reference,
                $orderId,
                $eligibleAmount,
                $reason,
                $sourceType,
                $sourceId,
                $onBalance,
                $createdBy,
            ): LoyaltyTransaction {
                $account = $this->lockAccount($user);

                if ($points < 0 && $account->balance + $points < 0) {
                    throw new InvalidArgumentException(__('diyar.loyalty.insufficient_balance'));
                }

                $updates = $onBalance($account, $points);

                $account->forceFill($updates)->save();

                return LoyaltyTransaction::query()->create([
                    'loyalty_account_id' => $account->id,
                    'type' => $type,
                    'points' => $points,
                    'balance_after' => $account->balance,
                    'reference' => $reference,
                    'source_type' => $sourceType,
                    'source_id' => $sourceId,
                    'order_id' => $orderId,
                    'eligible_amount' => $eligibleAmount,
                    'reason' => $reason,
                    'created_by' => $createdBy,
                ]);
            });
        } catch (QueryException $exception) {
            if ($this->isUniqueReferenceViolation($exception)) {
                return LoyaltyTransaction::query()->where('reference', $reference)->first();
            }

            throw $exception;
        }
    }

    private function lockAccount(User $user): LoyaltyAccount
    {
        $this->findOrCreateAccount($user);

        return LoyaltyAccount::query()
            ->where('user_id', $user->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function isUniqueReferenceViolation(QueryException $exception): bool
    {
        $code = (string) ($exception->errorInfo[1] ?? '');
        $sqlState = (string) ($exception->errorInfo[0] ?? '');

        if (in_array($code, ['1062', '23505', '19'], true)) {
            return true;
        }

        return $sqlState === '23000'
            && str_contains(strtolower($exception->getMessage()), 'loyalty_transactions.reference');
    }
}
