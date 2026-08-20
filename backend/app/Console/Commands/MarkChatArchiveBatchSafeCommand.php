<?php

namespace App\Console\Commands;

use App\Services\Chat\ChatArchiveService;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class MarkChatArchiveBatchSafeCommand extends Command
{
    protected $signature = 'chat:archive-mark-safe
                            {batchId : The archive batch UUID}
                            {--operator= : Operator identifier (required in production)}
                            {--note= : Optional promotion note}
                            {--force : Confirm promotion in production}';

    protected $description = 'Promote a verified archive batch to safe_to_purge (ops only)';

    public function handle(ChatArchiveService $archives): int
    {
        if ($this->laravel->environment('production') && ! $this->option('force')) {
            $this->error('Production promotion requires --force and --operator.');

            return self::FAILURE;
        }

        $operator = (string) ($this->option('operator') ?: get_current_user());
        if ($this->laravel->environment('production') && trim($operator) === '') {
            $this->error('--operator is required in production.');

            return self::FAILURE;
        }

        try {
            $batch = $archives->promoteBatchToSafeToPurge(
                (string) $this->argument('batchId'),
                $operator,
                $this->option('note') ? (string) $this->option('note') : null,
            );
        } catch (ModelNotFoundException) {
            $this->error('Archive batch not found.');

            return self::FAILURE;
        } catch (\InvalidArgumentException $exception) {
            $this->error($exception->getMessage());

            return self::FAILURE;
        }

        $this->info("Batch {$batch->id} promoted to safe_to_purge by {$operator}.");

        return self::SUCCESS;
    }
}
