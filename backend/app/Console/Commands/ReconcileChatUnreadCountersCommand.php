<?php

namespace App\Console\Commands;

use App\Domains\Chat\Services\ChatLockService;
use App\Domains\Chat\Services\ChatMetrics;
use App\Domains\Chat\Services\ChatUnreadCounterService;
use App\Models\User;
use Illuminate\Console\Command;

class ReconcileChatUnreadCountersCommand extends Command
{
    protected $signature = 'chat:reconcile-unread {--user= : Optional user UUID}';

    protected $description = 'Reconcile cached chat unread counters with database totals';

    public function handle(ChatUnreadCounterService $unreadCounter, ChatLockService $locks): int
    {
        $userId = $this->option('user');

        $result = $locks->run('reconcile-unread', function () use ($unreadCounter, $userId) {
            $startedAt = microtime(true);
            $count = 0;

            $query = User::query()->select('id');
            if (is_string($userId) && $userId !== '') {
                $query->where('id', $userId);
            }

            foreach ($query->cursor() as $user) {
                $unreadCounter->reconcileUser((string) $user->id);
                $count++;
            }

            ChatMetrics::info('chat.unread.reconciled', [
                'users' => $count,
                'duration_ms' => ChatMetrics::durationMs($startedAt),
            ]);

            return $count;
        });

        if ($result === null) {
            $this->error('Could not acquire reconciliation lock.');

            return self::FAILURE;
        }

        $this->info("Reconciled unread counters for {$result} user(s).");

        return self::SUCCESS;
    }
}
