<?php

namespace App\Services\Admin;

use App\Enums\ProviderReviewStatus;
use App\Models\ProviderAccount;
use App\Models\ProviderReview;
use App\Models\Service;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AdminReviewModerationService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function hideProviderReview(ProviderReview $review, User $actor, ?string $reason = null): ProviderReview
    {
        return $this->setProviderReviewStatus($review, $actor, ProviderReviewStatus::Hidden, 'provider_review.hide', $reason);
    }

    public function unhideProviderReview(ProviderReview $review, User $actor, ?string $reason = null): ProviderReview
    {
        return $this->setProviderReviewStatus($review, $actor, ProviderReviewStatus::Published, 'provider_review.unhide', $reason);
    }

    private function setProviderReviewStatus(
        ProviderReview $review,
        User $actor,
        ProviderReviewStatus $status,
        string $action,
        ?string $reason,
    ): ProviderReview {
        if ($review->status === $status) {
            return $review;
        }

        return DB::transaction(function () use ($review, $actor, $status, $action, $reason): ProviderReview {
            $before = ['status' => $review->status->value];
            $review->status = $status;
            $review->save();

            $this->syncProviderAggregates($review->provider_account_id, $review->service_id);

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $review,
                before: $before,
                after: ['status' => $review->status->value],
                reason: $reason,
            );

            return $review->fresh(['user', 'providerAccount', 'service']);
        });
    }

    private function syncProviderAggregates(string $providerAccountId, ?string $serviceId): void
    {
        $summary = ProviderReview::query()
            ->where('provider_account_id', $providerAccountId)
            ->where('status', ProviderReviewStatus::Published)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        ProviderAccount::query()->whereKey($providerAccountId)->update([
            'rating_average' => round((float) ($summary->avg_rating ?? 0), 2),
            'reviews_count' => (int) ($summary->total ?? 0),
        ]);

        if ($serviceId === null) {
            return;
        }

        $serviceSummary = ProviderReview::query()
            ->where('service_id', $serviceId)
            ->where('status', ProviderReviewStatus::Published)
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as total')
            ->first();

        Service::query()->whereKey($serviceId)->update([
            'rating_average' => round((float) ($serviceSummary->avg_rating ?? 0), 2),
            'reviews_count' => (int) ($serviceSummary->total ?? 0),
        ]);
    }
}
