<?php

namespace App\Listeners\Notifications;

use App\Contracts\Notifications\TriggersNotification;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

final class DispatchNotificationListener implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public function __construct(
        private readonly NotificationDispatcher $dispatcher,
    ) {}

    public function handle(TriggersNotification $event): void
    {
        $intent = $event->toNotificationIntent();

        if ($intent->recipients === []) {
            return;
        }

        $this->dispatcher->dispatch(
            type: $intent->type,
            recipients: $intent->recipients,
            payload: $intent->payload,
            entityType: $intent->entityType,
            entityId: $intent->entityId,
            dedupeKey: $intent->dedupeKey,
        );
    }
}
