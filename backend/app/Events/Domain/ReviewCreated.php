<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ProductReview;
use App\Services\Notifications\NotificationContextBuilder;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ReviewCreated implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly ProductReview $review,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->review->loadMissing(['user', 'product.vendorAccount.user']);

        $vendorUser = $this->review->product?->vendorAccount?->user;
        $builder = app(NotificationContextBuilder::class);

        return new NotificationIntent(
            type: NotificationType::ReviewCreated,
            recipients: array_filter([$vendorUser]),
            payload: [
                'product_name' => (string) ($this->review->product?->name ?? ''),
                'store_name' => (string) ($this->review->product?->vendorAccount?->business_name ?? ''),
                'reviewer_name' => (string) ($this->review->user?->name ?? ''),
                'rating' => (string) $this->review->rating,
                'detail_lines' => $builder->reviewDetailLines($this->review),
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/vendor/reviews',
            ],
            entityType: 'product_review',
            entityId: $this->review->id,
            dedupeKey: "review.created:{$this->review->id}",
        );
    }
}
