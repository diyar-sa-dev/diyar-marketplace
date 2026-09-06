<?php

namespace App\Console\Commands;

use App\Enums\DomainOutboxEventStatus;
use App\Models\DomainOutboxEvent;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class ReplayDomainOutboxDeadLetterCommand extends Command
{
    protected $signature = 'outbox:replay-dead-letter
                            {id? : Specific outbox event UUID to replay}
                            {--limit=50 : Max dead-letter events when no id is provided}';

    protected $description = 'Replay dead-letter outbox events back to pending for reprocessing';

    public function handle(): int
    {
        $lock = Cache::lock('diyar:outbox:replay-dead-letter', 120);

        if (! $lock->get()) {
            $this->warn('Another outbox replay is in progress.');

            return self::SUCCESS;
        }

        try {
            $id = $this->argument('id');

            $query = DomainOutboxEvent::query()
                ->where('status', DomainOutboxEventStatus::DeadLetter);

            if (is_string($id) && $id !== '') {
                $query->where('id', $id);
            } else {
                $query->orderBy('occurred_at')->limit((int) $this->option('limit'));
            }

            $events = $query->get();

            if ($events->isEmpty()) {
                $this->info('No dead-letter outbox events to replay.');

                return self::SUCCESS;
            }

            $replayed = 0;

            foreach ($events as $event) {
                $event->update([
                    'status' => DomainOutboxEventStatus::Pending,
                    'available_at' => now(),
                    'processed_at' => null,
                    'locked_at' => null,
                    'locked_by' => null,
                    'last_error' => null,
                ]);
                $replayed++;
                $this->line("Replayed {$event->id} ({$event->event_type})");
            }

            $this->info("Replayed {$replayed} dead-letter event(s). Run outbox:process to dispatch.");

            return self::SUCCESS;
        } finally {
            $lock->release();
        }
    }
}
