<?php

use App\Console\Commands\ReleaseExpiredInventoryReservations;
use App\Jobs\Chat\ArchiveOldMessagesJob;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command(ReleaseExpiredInventoryReservations::class)->everyMinute();

Schedule::job(new ArchiveOldMessagesJob)
    ->dailyAt('02:30')
    ->when(fn (): bool => (bool) config('diyar.chat.retention.archive_enabled', false));

Schedule::command('chat:reconcile-unread')->weeklyOn(1, '03:00');
