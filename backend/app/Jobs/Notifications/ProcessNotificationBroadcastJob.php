<?php

namespace App\Jobs\Notifications;

use App\Enums\NotificationBroadcastStatus;
use App\Enums\NotificationType;
use App\Models\NotificationBroadcast;
use App\Models\User;
use App\Services\Notifications\NotificationBroadcastService;
use App\Services\Notifications\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

final class ProcessNotificationBroadcastJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [30, 120, 300];

    public int $timeout = 300;

    private const CHUNK_SIZE = 200;

    public function __construct(
        public readonly string $broadcastId,
        public readonly ?string $afterUserId = null,
    ) {}

    public function handle(
        NotificationBroadcastService $broadcastService,
        NotificationDispatcher $dispatcher,
    ): void {
        $broadcast = NotificationBroadcast::query()->find($this->broadcastId);

        if ($broadcast === null) {
            return;
        }

        if (in_array($broadcast->status, [NotificationBroadcastStatus::Completed, NotificationBroadcastStatus::Cancelled], true)) {
            return;
        }

        if ($broadcast->expires_at !== null && $broadcast->expires_at->isPast()) {
            $broadcast->update([
                'status' => NotificationBroadcastStatus::Cancelled,
                'last_error' => 'Broadcast expired before completion.',
                'completed_at' => now(),
            ]);

            return;
        }

        if ($broadcast->status === NotificationBroadcastStatus::Pending) {
            $broadcast->update([
                'status' => NotificationBroadcastStatus::Processing,
                'started_at' => now(),
            ]);
        }

        $filter = is_array($broadcast->audience_filter) ? $broadcast->audience_filter : [];

        $query = $broadcastService
            ->audienceQuery($broadcast->audience_type, $filter)
            ->orderBy('id');

        if ($this->afterUserId !== null) {
            $query->where('id', '>', $this->afterUserId);
        }

        $users = $query->limit(self::CHUNK_SIZE)->get();

        if ($users->isEmpty()) {
            $broadcast->update([
                'status' => NotificationBroadcastStatus::Completed,
                'completed_at' => now(),
            ]);

            return;
        }

        $dedupePrefix = "broadcast:{$broadcast->id}";

        foreach ($users as $user) {
            if (! $user instanceof User) {
                continue;
            }

            $dispatcher->dispatch(
                NotificationType::SystemAlert,
                [$user],
                [
                    'title' => $broadcast->title,
                    'body' => $broadcast->body,
                    'category' => $broadcast->category,
                    'broadcast_id' => $broadcast->id,
                ],
                'broadcast',
                $broadcast->id,
                "{$dedupePrefix}:{$user->id}",
                is_array($broadcast->channels) ? $broadcast->channels : null,
                $broadcast->priority,
            );
        }

        $lastUserId = (string) $users->last()->id;
        $processed = $broadcast->processed_recipients + $users->count();

        $broadcast->update([
            'processed_recipients' => $processed,
            'queued_recipients' => $broadcast->queued_recipients + $users->count(),
        ]);

        ProcessNotificationBroadcastJob::dispatch($broadcast->id, $lastUserId)
            ->afterCommit()
            ->onQueue('broadcast');
    }

    public function failed(?Throwable $exception): void
    {
        $broadcast = NotificationBroadcast::query()->find($this->broadcastId);

        if ($broadcast === null) {
            return;
        }

        $broadcast->update([
            'status' => NotificationBroadcastStatus::Failed,
            'last_error' => $exception?->getMessage() ?? 'Broadcast job failed.',
            'completed_at' => now(),
        ]);

        Log::error('notifications.broadcast.failed', [
            'broadcast_id' => $this->broadcastId,
            'error' => $exception?->getMessage(),
        ]);
    }
}
