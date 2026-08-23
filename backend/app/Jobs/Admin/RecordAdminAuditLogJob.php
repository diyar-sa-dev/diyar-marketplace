<?php

namespace App\Jobs\Admin;

use App\Models\AdminAuditLog;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

final class RecordAdminAuditLogJob implements ShouldQueue
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly array $payload,
    ) {}

    public function handle(): void
    {
        AdminAuditLog::query()->create($this->payload);
    }
}
