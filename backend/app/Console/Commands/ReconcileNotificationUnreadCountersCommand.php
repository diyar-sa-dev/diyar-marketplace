<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationUnreadCounterService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

final class ReconcileNotificationUnreadCountersCommand extends Command
{
    protected $signature = 'notifications:reconcile-unread {--user= : Reconcile a single user id} {--chunk=200 : Users per batch}';

    protected $description = 'Rebuild Redis unread counters from the database and report mismatches';

    public function handle(NotificationUnreadCounterService $counters): int
    {
        $userId = $this->option('user');
        if (is_string($userId) && $userId !== '') {
            $this->reconcileUser($counters, $userId);

            return self::SUCCESS;
        }

        $chunkSize = max(1, (int) $this->option('chunk'));
        $mismatches = 0;
        $rebuilt = 0;

        UserNotification::query()
            ->select('user_id')
            ->whereNull('read_at')
            ->distinct()
            ->orderBy('user_id')
            ->chunk($chunkSize, function ($rows) use ($counters, &$mismatches, &$rebuilt): void {
                foreach ($rows as $row) {
                    $mismatches += $this->reconcileUser($counters, (string) $row->user_id);
                    $rebuilt++;
                }
            });

        $this->info("Rebuilt unread counters for {$rebuilt} users; {$mismatches} mismatches corrected.");

        return self::SUCCESS;
    }

    private function reconcileUser(NotificationUnreadCounterService $counters, string $userId): int
    {
        $key = $counters->keyForUser($userId);
        $cached = Cache::get($key);
        $cachedCount = is_int($cached) || (is_string($cached) && ctype_digit($cached))
            ? max(0, (int) $cached)
            : null;

        $user = User::query()->find($userId);
        if (! $user instanceof User) {
            $counters->forget($userId);

            return $cachedCount !== null && $cachedCount !== 0 ? 1 : 0;
        }

        $authoritative = (int) UserNotification::query()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();

        $rebuilt = $counters->rebuild($user);

        if ($cachedCount !== null && $cachedCount !== $authoritative) {
            $this->line("Mismatch user {$userId}: cache={$cachedCount} db={$authoritative} rebuilt={$rebuilt}");

            return 1;
        }

        return 0;
    }
}
