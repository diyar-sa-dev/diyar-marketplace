<?php

namespace App\Console\Commands;

use App\Models\NotificationDelivery;
use App\Models\UserNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

final class PruneNotificationsCommand extends Command
{
    protected $signature = 'notifications:prune {--dry-run : Report counts without deleting}';

    protected $description = 'Prune old read notifications and stale delivery records in chunks';

    public function handle(): int
    {
        if (! config('diyar.notifications.retention.enabled', true)) {
            $this->info('Notification retention pruning is disabled.');

            return self::SUCCESS;
        }

        $readDays = (int) config('diyar.notifications.retention.read_days', 120);
        $deliveryDays = (int) config('diyar.notifications.retention.delivery_days', 180);
        $chunk = (int) config('diyar.notifications.retention.chunk_size', 500);
        $dryRun = (bool) $this->option('dry-run');

        $readCutoff = Carbon::now()->subDays($readDays);
        $deliveryCutoff = Carbon::now()->subDays($deliveryDays);

        $readQuery = UserNotification::query()
            ->whereNotNull('read_at')
            ->where('read_at', '<', $readCutoff)
            ->where('priority', '!=', 'critical');

        $deliveryQuery = NotificationDelivery::query()
            ->where('updated_at', '<', $deliveryCutoff)
            ->whereIn('status', ['delivered', 'suppressed', 'skipped', 'cancelled']);

        $readCount = (clone $readQuery)->count();
        $deliveryCount = (clone $deliveryQuery)->count();

        $this->line("Read notifications eligible: {$readCount}");
        $this->line("Stale deliveries eligible: {$deliveryCount}");

        if ($dryRun) {
            return self::SUCCESS;
        }

        $deletedRead = 0;
        $readQuery->orderBy('id')->chunkById($chunk, function ($notifications) use (&$deletedRead) {
            $ids = $notifications->pluck('id');
            $deletedRead += UserNotification::query()->whereIn('id', $ids)->delete();
        });

        $deletedDeliveries = 0;
        $deliveryQuery->orderBy('id')->chunkById($chunk, function ($deliveries) use (&$deletedDeliveries) {
            $ids = $deliveries->pluck('id');
            $deletedDeliveries += NotificationDelivery::query()->whereIn('id', $ids)->delete();
        });

        $this->info("Pruned {$deletedRead} read notifications and {$deletedDeliveries} delivery records.");

        return self::SUCCESS;
    }
}
