<?php

namespace App\Console\Commands;

use App\Services\Chat\ChatArchiveService;
use Illuminate\Console\Command;

class ChatArchiveStatusCommand extends Command
{
    protected $signature = 'chat:archive-status {--batch= : Show a single batch by UUID} {--limit=20 : Number of recent batches}';

    protected $description = 'Show chat archive batch status for operations';

    public function handle(ChatArchiveService $archives): int
    {
        $batchId = $this->option('batch');

        if (is_string($batchId) && $batchId !== '') {
            $verification = $archives->verifyExistingBatch($batchId);
            $this->line('Batch: '.$batchId);
            $this->line('Valid: '.($verification['valid'] ? 'yes' : 'no'));
            $this->line('Message count: '.$verification['message_count']);
            $this->line('Checksum: '.$verification['checksum']);

            if ($verification['errors'] !== []) {
                $this->warn('Errors:');
                foreach ($verification['errors'] as $error) {
                    $this->line(' - '.$error);
                }
            }

            return $verification['valid'] ? self::SUCCESS : self::FAILURE;
        }

        $rows = $archives->recentBatchSummaries((int) $this->option('limit'));

        if ($rows === []) {
            $this->info('No archive batches found.');

            return self::SUCCESS;
        }

        $this->table(
            ['ID', 'Status', 'Messages', 'Verified', 'Safe', 'Promoted By', 'Created'],
            array_map(fn (array $row) => [
                $row['id'],
                $row['status'],
                $row['message_count'],
                $row['verified_at'] ?? '-',
                $row['safe_to_purge_at'] ?? '-',
                $row['promoted_by'] ?? '-',
                $row['created_at'] ?? '-',
            ], $rows),
        );

        return self::SUCCESS;
    }
}
