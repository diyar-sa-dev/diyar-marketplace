<?php

namespace App\Console\Commands;

use App\Services\Chat\ChatArchiveService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class VerifyChatArchiveBatchCommand extends Command
{
    protected $signature = 'chat:archive-verify {batchId : The archive batch UUID}';

    protected $description = 'Re-verify an archive batch checksum and line count (staging/recovery drill)';

    public function handle(ChatArchiveService $archives): int
    {
        try {
            $result = $archives->verifyExistingBatch((string) $this->argument('batchId'));
        } catch (ModelNotFoundException) {
            $this->error('Archive batch not found.');

            return self::FAILURE;
        }

        if ($result['valid']) {
            $this->info("Batch verified OK ({$result['message_count']} messages, checksum match).");

            return self::SUCCESS;
        }

        $this->error('Batch verification failed:');
        foreach ($result['errors'] as $error) {
            $this->line(' - '.$error);
        }

        return self::FAILURE;
    }
}
