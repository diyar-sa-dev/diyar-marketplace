<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ReturnRequest;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class ReturnUpdated implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly ReturnRequest $returnRequest,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->returnRequest->loadMissing('user');

        return new NotificationIntent(
            type: NotificationType::ReturnUpdated,
            recipients: array_filter([$this->returnRequest->user]),
            payload: [
                'status' => $this->returnRequest->status->value,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/returns/'.$this->returnRequest->id,
            ],
            entityType: 'return',
            entityId: $this->returnRequest->id,
            dedupeKey: "return.updated:{$this->returnRequest->id}:{$this->returnRequest->status->value}",
        );
    }
}
