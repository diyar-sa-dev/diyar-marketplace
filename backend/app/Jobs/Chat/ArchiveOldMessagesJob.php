<?php

namespace App\Jobs\Chat;

use App\Services\Chat\ChatArchiveService;
use App\Support\Chat\ChatQueue;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

final class ArchiveOldMessagesJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [60, 300, 900];

    public function __construct(
        public readonly ?int $limit = null,
    ) {
        $this->onQueue(ChatQueue::archive());
    }

    public function handle(ChatArchiveService $archiveService): void
    {
        Log::info('chat.archive.started', ['limit' => $this->limit]);

        $result = $archiveService->archiveEligibleMessages($this->limit);

        Log::info('chat.archive.finished', $result);
    }
}
