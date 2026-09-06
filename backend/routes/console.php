<?php

use App\Console\Commands\ReleaseExpiredInventoryReservations;
use App\Jobs\Chat\ArchiveOldMessagesJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

/**
 * Distributed schedule mutex for horizontally scaled production nodes.
 * Requires a shared cache store (Redis recommended).
 */
$oneServer = static function ($event) {
    if (in_array(config('cache.default'), ['redis', 'memcached', 'database'], true)) {
        $event->onOneServer();
    }

    return $event;
};

$oneServer(Schedule::command(ReleaseExpiredInventoryReservations::class)->everyMinute())
    ->withoutOverlapping(5);

$oneServer(Schedule::job(new ArchiveOldMessagesJob)->dailyAt('02:30'))
    ->when(fn (): bool => (bool) config('diyar.chat.retention.archive_enabled', false));

$oneServer(Schedule::command('chat:reconcile-unread')->weeklyOn(1, '03:00'));

$oneServer(Schedule::command('notifications:broadcasts:dispatch-scheduled')->everyMinute())
    ->withoutOverlapping(5);

$oneServer(Schedule::command('outbox:process')->everyMinute())
    ->withoutOverlapping(5);

$oneServer(Schedule::command('outbox:recover')->everyFiveMinutes())
    ->withoutOverlapping(10);

$oneServer(Schedule::command('notifications:reconcile-deliveries')->everyFifteenMinutes())
    ->withoutOverlapping(15);

$oneServer(Schedule::command('notifications:reconcile-unread')->weeklyOn(1, '03:30'));

$oneServer(Schedule::command('payments:reconcile')->everyFifteenMinutes())
    ->withoutOverlapping(15);

$oneServer(Schedule::command('notifications:prune')->dailyAt('04:00'))
    ->when(fn (): bool => (bool) config('diyar.notifications.retention.enabled', true));
