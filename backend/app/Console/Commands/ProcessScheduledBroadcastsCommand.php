<?php

namespace App\Console\Commands;

use App\Enums\NotificationBroadcastStatus;
use App\Jobs\Notifications\ProcessNotificationBroadcastJob;
use App\Models\NotificationBroadcast;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class ProcessScheduledBroadcastsCommand extends Command
{
    protected $signature = 'notifications:broadcasts:dispatch-scheduled';

    protected $description = 'Dispatch notification broadcasts whose scheduled_at has arrived';

    public function handle(): int
    {
        $lock = Cache::lock('notifications:broadcasts:dispatch-scheduled', 55);

        if (! $lock->get()) {
            $this->warn('Another scheduled broadcast dispatch is in progress.');

            return self::SUCCESS;
        }

        try {
            $due = NotificationBroadcast::query()
                ->where('status', NotificationBroadcastStatus::Pending)
                ->whereNotNull('scheduled_at')
                ->where('scheduled_at', '<=', now())
                ->orderBy('scheduled_at')
                ->limit(50)
                ->get();

            if ($due->isEmpty()) {
                $this->info('No scheduled broadcasts due.');

                return self::SUCCESS;
            }

            $dispatched = 0;

            foreach ($due as $broadcast) {
                $claimed = NotificationBroadcast::query()
                    ->where('id', $broadcast->id)
                    ->where('status', NotificationBroadcastStatus::Pending)
                    ->update([
                        'status' => NotificationBroadcastStatus::Processing,
                        'started_at' => now(),
                    ]);

                if ($claimed !== 1) {
                    continue;
                }

                ProcessNotificationBroadcastJob::dispatch($broadcast->id)
                    ->afterCommit()
                    ->onQueue('broadcast');

                $this->line("Queued broadcast {$broadcast->id}");
                $dispatched++;
            }

            $this->info("Dispatched {$dispatched} scheduled broadcast(s).");
        } finally {
            $lock->release();
        }

        return self::SUCCESS;
    }
}
