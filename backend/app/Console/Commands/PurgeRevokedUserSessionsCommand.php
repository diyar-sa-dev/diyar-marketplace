<?php

namespace App\Console\Commands;

use App\Models\UserSession;
use Illuminate\Console\Command;

class PurgeRevokedUserSessionsCommand extends Command
{
    protected $signature = 'user-sessions:purge-revoked {--days= : Retention window in days}';

    protected $description = 'Delete revoked user session metadata past the retention window';

    public function handle(): int
    {
        $days = (int) ($this->option('days') ?: config('diyar.security.revoked_session_retention_days', 90));
        $cutoff = now()->subDays(max(1, $days));

        $deleted = UserSession::query()
            ->whereNotNull('revoked_at')
            ->where('revoked_at', '<', $cutoff)
            ->delete();

        $this->info("Purged {$deleted} revoked user session record(s) older than {$days} day(s).");

        return self::SUCCESS;
    }
}
