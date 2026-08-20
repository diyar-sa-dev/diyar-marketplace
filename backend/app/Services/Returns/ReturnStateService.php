<?php

namespace App\Services\Returns;

use App\Enums\ReturnRequestStatus;
use App\Events\Domain\ReturnUpdated;
use App\Models\ReturnRequest;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ReturnStateService
{
    /** @var array<string, list<ReturnRequestStatus>> */
    private const TRANSITIONS = [
        'requested' => [ReturnRequestStatus::UnderReview, ReturnRequestStatus::Cancelled],
        'under_review' => [ReturnRequestStatus::Approved, ReturnRequestStatus::Rejected, ReturnRequestStatus::Cancelled],
        'approved' => [ReturnRequestStatus::AwaitingReturn],
        'awaiting_return' => [ReturnRequestStatus::Received],
        'received' => [ReturnRequestStatus::Inspected],
        'inspected' => [ReturnRequestStatus::Refunded],
        'rejected' => [],
        'refunded' => [],
        'cancelled' => [],
    ];

    public function transition(ReturnRequest $returnRequest, ReturnRequestStatus $to, array $attributes = []): ReturnRequest
    {
        $allowed = self::TRANSITIONS[$returnRequest->status->value] ?? [];

        if (! in_array($to, $allowed, true)) {
            throw new InvalidArgumentException(__('diyar.returns.invalid_status_transition'));
        }

        $updates = array_merge(['status' => $to], $attributes);

        $timestampMap = [
            ReturnRequestStatus::UnderReview->value => 'reviewed_at',
            ReturnRequestStatus::Approved->value => 'approved_at',
            ReturnRequestStatus::Rejected->value => 'rejected_at',
            ReturnRequestStatus::Received->value => 'received_at',
            ReturnRequestStatus::Inspected->value => 'inspected_at',
            ReturnRequestStatus::Refunded->value => 'refunded_at',
            ReturnRequestStatus::Cancelled->value => 'cancelled_at',
        ];

        if (isset($timestampMap[$to->value]) && ! array_key_exists($timestampMap[$to->value], $attributes)) {
            $updates[$timestampMap[$to->value]] = now();
        }

        $returnRequest->update($updates);

        $fresh = $returnRequest->fresh();
        DB::afterCommit(fn () => event(new ReturnUpdated($fresh)));

        return $fresh;
    }
}
