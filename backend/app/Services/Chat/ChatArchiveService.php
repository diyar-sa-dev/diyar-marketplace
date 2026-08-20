<?php

namespace App\Services\Chat;

use App\Enums\ChatArchiveBatchStatus;
use App\Enums\ConversationLifecycleStatus;
use App\Models\ChatArchiveBatch;
use App\Models\Message;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class ChatArchiveService
{
    public function __construct(
        private readonly ChatLockService $locks,
    ) {}

    /**
     * @return array{archived: int, batches: int, verified: int, failed: int}
     */
    public function archiveEligibleMessages(?int $limit = null): array
    {
        if (! (bool) config('diyar.chat.retention.archive_enabled', false)) {
            return ['archived' => 0, 'batches' => 0, 'verified' => 0, 'failed' => 0];
        }

        $result = $this->locks->run('archive-job', function () use ($limit) {
            return $this->processArchive($limit);
        }, seconds: 300, waitSeconds: 10);

        return $result ?? ['archived' => 0, 'batches' => 0, 'verified' => 0, 'failed' => 0];
    }

    /**
     * @return array{archived: int, batches: int, verified: int, failed: int}
     */
    private function processArchive(?int $limit): array
    {
        $startedAt = microtime(true);
        ChatMetrics::info('chat.archive.started', ['limit' => $limit]);

        $archiveAfterDays = (int) config('diyar.chat.retention.archive_after_days', 365);
        $batchSize = (int) config('diyar.chat.retention.batch_size', 200);
        $cutoff = now()->subDays($archiveAfterDays);
        $disk = (string) config('diyar.chat.retention.archive_disk', 'local');

        $archived = 0;
        $batches = 0;
        $verified = 0;
        $failed = 0;
        $remaining = $limit;

        $query = $this->eligibleMessagesQuery($cutoff);

        while ($remaining === null || $remaining > 0) {
            $chunkSize = $remaining === null ? $batchSize : min($batchSize, $remaining);
            $messages = (clone $query)->limit($chunkSize)->get();

            if ($messages->isEmpty()) {
                break;
            }

            $batchResult = $this->archiveBatch($messages, $disk);
            $batches++;

            if ($batchResult['success']) {
                $archived += $batchResult['count'];
                $verified += $batchResult['verified'] ? 1 : 0;
            } else {
                $failed++;
            }

            $remaining = $remaining === null ? null : $remaining - $batchResult['count'];
        }

        ChatMetrics::info('chat.archive.completed', [
            'archived' => $archived,
            'batches' => $batches,
            'verified' => $verified,
            'failed' => $failed,
            'duration_ms' => ChatMetrics::durationMs($startedAt),
        ]);

        return compact('archived', 'batches', 'verified', 'failed');
    }

    /**
     * @param  Collection<int, Message>  $messages
     * @return array{success: bool, count: int, verified: bool}
     */
    private function archiveBatch($messages, string $disk): array
    {
        $batchId = (string) Str::uuid();
        $relativePath = 'chat-archives/'.$batchId.'.jsonl';

        $batch = ChatArchiveBatch::query()->create([
            'id' => $batchId,
            'message_count' => $messages->count(),
            'checksum' => '',
            'storage_disk' => $disk,
            'storage_location' => $relativePath,
            'status' => ChatArchiveBatchStatus::Archiving,
            'started_at' => now(),
        ]);

        try {
            $lines = [];

            foreach ($messages as $message) {
                $message->loadMissing(['attachments', 'sender']);
                $lines[] = json_encode([
                    'id' => $message->id,
                    'conversation_id' => $message->conversation_id,
                    'sender_id' => $message->sender_id,
                    'body' => $message->body,
                    'message_type' => $message->message_type->value,
                    'created_at' => $message->created_at?->toIso8601String(),
                    'attachments' => $message->attachments->map(fn ($attachment) => [
                        'id' => $attachment->id,
                        'path' => $attachment->path,
                        'original_name' => $attachment->original_name,
                        'mime_type' => $attachment->mime_type,
                        'size_bytes' => $attachment->size_bytes,
                    ])->values()->all(),
                ], JSON_THROW_ON_ERROR);
            }

            $payload = implode("\n", $lines)."\n";
            Storage::disk($disk)->put($relativePath, $payload);

            if (! Storage::disk($disk)->exists($relativePath)) {
                throw new \RuntimeException('archive_file_missing');
            }

            $checksum = hash('sha256', $payload);

            $batch->update([
                'checksum' => $checksum,
                'status' => ChatArchiveBatchStatus::Uploaded,
                'uploaded_at' => now(),
            ]);

            $this->verifyBatch($batch, $payload, $lines);

            $messageIds = $messages->pluck('id')->all();

            DB::transaction(function () use ($messageIds, $batchId, $batch): void {
                Message::query()
                    ->whereIn('id', $messageIds)
                    ->whereNull('archived_at')
                    ->update([
                        'archived_at' => now(),
                        'archive_batch_id' => $batchId,
                    ]);

                if ($this->shouldPurgeBatch($batch)) {
                    Message::query()->whereIn('id', $messageIds)->delete();
                }
            });

            $batch->update(['completed_at' => now()]);

            ChatMetrics::info('chat.archive.batch.completed', [
                'batch_id' => $batchId,
                'message_count' => count($messageIds),
                'status' => $batch->fresh()?->status?->value,
            ]);

            return [
                'success' => true,
                'count' => count($messageIds),
                'verified' => $batch->fresh()?->status === ChatArchiveBatchStatus::Verified
                    || $batch->fresh()?->status === ChatArchiveBatchStatus::SafeToPurge,
            ];
        } catch (\Throwable $exception) {
            $batch->update([
                'status' => ChatArchiveBatchStatus::Failed,
                'error_message' => $exception->getMessage(),
                'completed_at' => now(),
            ]);

            ChatMetrics::warning('chat.archive.failed', [
                'batch_id' => $batchId,
                'error' => $exception->getMessage(),
            ]);

            return ['success' => false, 'count' => 0, 'verified' => false];
        }
    }

    private function verifyBatch(ChatArchiveBatch $batch, string $payload, array $lines): void
    {
        $stored = Storage::disk($batch->storage_disk)->get($batch->storage_location);

        if ($stored === null) {
            throw new \RuntimeException('archive_read_failed');
        }

        if (hash('sha256', $stored) !== $batch->checksum) {
            throw new \RuntimeException('archive_checksum_mismatch');
        }

        if (substr_count($stored, "\n") !== count($lines)) {
            throw new \RuntimeException('archive_line_count_mismatch');
        }

        $batch->update([
            'status' => ChatArchiveBatchStatus::Verified,
            'verified_at' => now(),
        ]);

        if ((bool) config('diyar.chat.retention.auto_mark_safe_to_purge', false)) {
            $batch->update([
                'status' => ChatArchiveBatchStatus::SafeToPurge,
                'safe_to_purge_at' => now(),
            ]);
        }
    }

    private function shouldPurgeBatch(ChatArchiveBatch $batch): bool
    {
        if (! (bool) config('diyar.chat.retention.purge_after_archive', false)) {
            return false;
        }

        if ((bool) config('diyar.chat.retention.purge_requires_safe_to_purge', true)) {
            return $batch->fresh()?->canPurge() ?? false;
        }

        return $batch->fresh()?->status === ChatArchiveBatchStatus::Verified;
    }

    public function markBatchSafeToPurge(string $batchId, ?string $operator = null, ?string $note = null): ?ChatArchiveBatch
    {
        try {
            return $this->promoteBatchToSafeToPurge($batchId, $operator ?? 'system', $note);
        } catch (\InvalidArgumentException) {
            return null;
        }
    }

    public function promoteBatchToSafeToPurge(string $batchId, string $operator, ?string $note = null): ChatArchiveBatch
    {
        $batch = ChatArchiveBatch::query()->findOrFail($batchId);

        if ($batch->status !== ChatArchiveBatchStatus::Verified) {
            throw new \InvalidArgumentException(
                'Batch must be in verified status before promotion. Current status: '.$batch->status->value
            );
        }

        $batch->update([
            'status' => ChatArchiveBatchStatus::SafeToPurge,
            'safe_to_purge_at' => now(),
            'promoted_by' => $operator,
            'promoted_via' => 'artisan:chat:archive-mark-safe',
            'promotion_note' => $note,
        ]);

        ChatMetrics::info('chat.archive.promoted_safe_to_purge', [
            'batch_id' => $batchId,
            'operator' => $operator,
            'message_count' => $batch->message_count,
        ]);

        return $batch->fresh();
    }

    /**
     * @return array{valid: bool, message_count: int, checksum: string, errors: list<string>}
     */
    public function verifyExistingBatch(string $batchId): array
    {
        $batch = ChatArchiveBatch::query()->findOrFail($batchId);
        $errors = [];

        if (! in_array($batch->status, [ChatArchiveBatchStatus::Uploaded, ChatArchiveBatchStatus::Verified, ChatArchiveBatchStatus::SafeToPurge], true)) {
            $errors[] = 'Batch has not completed upload verification pipeline.';
        }

        $stored = Storage::disk($batch->storage_disk)->get($batch->storage_location);
        if ($stored === null) {
            $errors[] = 'Archive file missing from storage.';
        } elseif ($batch->checksum !== '' && hash('sha256', $stored) !== $batch->checksum) {
            $errors[] = 'Checksum mismatch between stored file and batch record.';
        }

        $lineCount = $stored !== null ? substr_count($stored, "\n") : 0;
        if ($lineCount !== $batch->message_count) {
            $errors[] = "Line count mismatch: expected {$batch->message_count}, found {$lineCount}.";
        }

        return [
            'valid' => $errors === [],
            'message_count' => $lineCount,
            'checksum' => $batch->checksum,
            'errors' => $errors,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recentBatchSummaries(int $limit = 20): array
    {
        return ChatArchiveBatch::query()
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn (ChatArchiveBatch $batch) => [
                'id' => $batch->id,
                'status' => $batch->status->value,
                'message_count' => $batch->message_count,
                'checksum' => $batch->checksum,
                'storage_location' => $batch->storage_location,
                'promoted_by' => $batch->promoted_by,
                'verified_at' => $batch->verified_at?->toIso8601String(),
                'safe_to_purge_at' => $batch->safe_to_purge_at?->toIso8601String(),
                'created_at' => $batch->created_at?->toIso8601String(),
            ])
            ->values()
            ->all();
    }

    private function eligibleMessagesQuery(Carbon $cutoff): Builder
    {
        $blockedStatuses = [
            ConversationLifecycleStatus::Archived->value,
            ConversationLifecycleStatus::Closed->value,
            ConversationLifecycleStatus::Blocked->value,
        ];

        return Message::query()
            ->whereNull('archived_at')
            ->where('created_at', '<', $cutoff)
            ->whereHas('conversation', function (Builder $query) use ($blockedStatuses): void {
                $query->where('retention_policy', 'standard')
                    ->whereNotIn('lifecycle_status', $blockedStatuses)
                    ->where(function (Builder $inner): void {
                        $inner->whereNull('retain_until')
                            ->orWhere('retain_until', '<', now());
                    });
            })
            ->orderBy('created_at')
            ->orderBy('id');
    }
}
