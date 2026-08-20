<?php

namespace App\Console\Commands;

use App\Jobs\Chat\ArchiveOldMessagesJob;
use App\Services\Chat\ChatArchiveService;
use Illuminate\Console\Command;

class RunChatArchiveCommand extends Command
{
    protected $signature = 'chat:archive
                            {--limit= : Maximum messages to archive in this run}
                            {--sync : Run synchronously instead of dispatching a queue job}
                            {--force : Run even when CHAT_ARCHIVE_ENABLED=false}';

    protected $description = 'Archive eligible chat messages (dispatches chat-low job by default)';

    public function handle(ChatArchiveService $archives): int
    {
        if (! (bool) config('diyar.chat.retention.archive_enabled', false) && ! $this->option('force')) {
            $this->error('CHAT_ARCHIVE_ENABLED=false. Use --force for staging drills only.');

            return self::FAILURE;
        }

        $limit = $this->option('limit');
        $limit = is_numeric($limit) ? (int) $limit : null;

        if ($this->option('sync')) {
            $result = $archives->archiveEligibleMessages($limit);
            $this->info(sprintf(
                'Archive complete: archived=%d batches=%d verified=%d failed=%d',
                $result['archived'],
                $result['batches'],
                $result['verified'],
                $result['failed'],
            ));

            return $result['failed'] > 0 ? self::FAILURE : self::SUCCESS;
        }

        ArchiveOldMessagesJob::dispatch($limit);
        $this->info('ArchiveOldMessagesJob dispatched to chat-low queue.');

        return self::SUCCESS;
    }
}
