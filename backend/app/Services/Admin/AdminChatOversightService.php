<?php

namespace App\Services\Admin;

use App\Enums\ChatMessageReportStatus;
use App\Models\ChatMessageReport;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Services\Chat\ChatModerationEnforcementService;
use App\Services\Chat\ChatRealtimeBroadcaster;
use App\Services\Chat\ChatReportNotificationService;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use InvalidArgumentException;

final class AdminChatOversightService
{
    public function __construct(
        private readonly ChatRealtimeBroadcaster $realtime,
        private readonly ChatReportNotificationService $reportNotifications,
        private readonly ChatModerationEnforcementService $enforcement,
    ) {}
    /**
     * @param  array{type?: string, user_id?: string, q?: string, has_reports?: bool}  $filters
     * @return LengthAwarePaginator<int, Conversation>
     */
    public function searchConversations(array $filters, int $page, int $perPage): LengthAwarePaginator
    {
        $query = Conversation::query()
            ->with(['participants.user', 'lastMessage', 'vendorAccount', 'providerAccount'])
            ->withCount(['messageReports as pending_reports_count' => function (Builder $builder): void {
                $builder->where('status', 'pending');
            }]);

        if (($filters['type'] ?? '') !== '') {
            $query->where('type', $filters['type']);
        }

        if (($filters['user_id'] ?? '') !== '') {
            $userId = (string) $filters['user_id'];
            $query->whereHas('participants', fn (Builder $builder) => $builder->where('user_id', $userId));
        }

        if (($filters['has_reports'] ?? false) === true) {
            $query->whereHas('messageReports');
        }

        $search = trim((string) ($filters['q'] ?? ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $builder) use ($like): void {
                $builder->where('subject', 'like', $like)
                    ->orWhereHas('participants.user', fn (Builder $userQuery) => $userQuery->where('name', 'like', $like));
            });
        }

        return $query
            ->orderByDesc('last_message_at')
            ->orderByDesc('created_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    public function findConversation(string $conversationId): Conversation
    {
        return Conversation::query()
            ->with(['participants.user', 'lastMessage', 'vendorAccount', 'providerAccount', 'creator'])
            ->withCount(['messageReports as pending_reports_count' => function (Builder $builder): void {
                $builder->where('status', 'pending');
            }])
            ->findOrFail($conversationId);
    }

    /**
     * @return array{items: list<Message>, next_cursor: string|null}
     */
    public function listMessages(Conversation $conversation, ?string $cursor, int $limit = 50): array
    {
        $query = Message::query()
            ->where('conversation_id', $conversation->id)
            ->whereNull('archived_at')
            ->with(['sender', 'attachments'])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($cursor !== null && $cursor !== '') {
            [$createdAt, $id] = $this->decodeCursor($cursor);
            $query->where(function (Builder $builder) use ($createdAt, $id): void {
                $builder->where('created_at', '<', $createdAt)
                    ->orWhere(function (Builder $inner) use ($createdAt, $id): void {
                        $inner->where('created_at', '=', $createdAt)
                            ->where('id', '<', $id);
                    });
            });
        }

        $messages = $query->limit($limit + 1)->get();
        $hasMore = $messages->count() > $limit;
        $items = $messages->take($limit)->values()->all();
        $items = array_reverse($items);

        $nextCursor = null;
        if ($hasMore && count($items) > 0) {
            $oldest = $items[0];
            if ($oldest instanceof Message) {
                $nextCursor = $this->encodeCursor($oldest);
            }
        }

        return [
            'items' => $items,
            'next_cursor' => $nextCursor,
        ];
    }

    /**
     * @param  array{status?: string, reason?: string, conversation_id?: string, q?: string}  $filters
     * @return LengthAwarePaginator<int, ChatMessageReport>
     */
    public function listReports(array $filters, int $page, int $perPage): LengthAwarePaginator
    {
        $query = ChatMessageReport::query()
            ->with(['conversation', 'message.sender', 'reporter']);

        if (($filters['status'] ?? '') !== '') {
            $query->where('status', $filters['status']);
        }

        if (($filters['reason'] ?? '') !== '') {
            $query->where('reason', $filters['reason']);
        }

        if (($filters['conversation_id'] ?? '') !== '') {
            $query->where('conversation_id', $filters['conversation_id']);
        }

        $search = trim((string) ($filters['q'] ?? ''));
        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(function (Builder $builder) use ($like): void {
                $builder->where('reason', 'like', $like)
                    ->orWhere('details', 'like', $like)
                    ->orWhereHas('reporter', fn (Builder $reporter) => $reporter->where('name', 'like', $like))
                    ->orWhereHas('message', fn (Builder $message) => $message->where('body', 'like', $like));
            });
        }

        return $query
            ->orderByDesc('created_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    public function findReport(string $reportId): ChatMessageReport
    {
        return ChatMessageReport::query()
            ->with(['conversation.participants.user', 'message.sender', 'message.attachments', 'reporter'])
            ->findOrFail($reportId);
    }

    /**
     * @return array{report: ChatMessageReport, conversation: Conversation, messages: list<Message>}
     */
    public function findReportDetail(string $reportId, int $contextRadius = 2): array
    {
        $report = $this->findReport($reportId);
        $conversation = $this->findConversation($report->conversation_id);
        $messages = $this->listReportContextMessages($report, $contextRadius);

        return [
            'report' => $report,
            'conversation' => $conversation,
            'messages' => $messages,
        ];
    }

    /**
     * @return list<Message>
     */
    public function listReportContextMessages(ChatMessageReport $report, int $radius = 2): array
    {
        $reportedMessage = $report->message;
        if (! $reportedMessage instanceof Message) {
            return [];
        }

        $conversationId = $report->conversation_id;
        $createdAt = $reportedMessage->created_at;
        $messageId = $reportedMessage->id;

        $beforeQuery = Message::query()
            ->where('conversation_id', $conversationId)
            ->whereNull('archived_at')
            ->where(function (Builder $builder) use ($createdAt, $messageId): void {
                $builder->where('created_at', '<', $createdAt)
                    ->orWhere(function (Builder $inner) use ($createdAt, $messageId): void {
                        $inner->where('created_at', '=', $createdAt)
                            ->where('id', '<', $messageId);
                    });
            })
            ->with(['sender', 'attachments'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(max(0, $radius));

        /** @var list<Message> $before */
        $before = $beforeQuery->get()->reverse()->values()->all();

        $reportedMessage->loadMissing(['sender', 'attachments']);

        $after = Message::query()
            ->where('conversation_id', $conversationId)
            ->whereNull('archived_at')
            ->where(function (Builder $builder) use ($createdAt, $messageId): void {
                $builder->where('created_at', '>', $createdAt)
                    ->orWhere(function (Builder $inner) use ($createdAt, $messageId): void {
                        $inner->where('created_at', '=', $createdAt)
                            ->where('id', '>', $messageId);
                    });
            })
            ->with(['sender', 'attachments'])
            ->orderBy('created_at')
            ->orderBy('id')
            ->limit(max(0, $radius))
            ->get()
            ->values()
            ->all();

        return [...$before, $reportedMessage, ...$after];
    }

    public function resolveReport(
        string $reportId,
        User $admin,
        string $status,
        ?string $resolutionNote,
        ?string $actionTaken,
    ): ChatMessageReport {
        $report = ChatMessageReport::query()->with(['message.sender'])->findOrFail($reportId);
        $nextStatus = ChatMessageReportStatus::from($status);

        if ($report->status->isTerminal()) {
            throw new InvalidArgumentException('Report is already resolved.');
        }

        if ($nextStatus === ChatMessageReportStatus::Pending) {
            throw new InvalidArgumentException('Cannot transition report back to pending.');
        }

        if (in_array($actionTaken, ['suspend_account', 'escalate'], true)) {
            $sender = $report->message?->sender;
            if (! $sender instanceof User) {
                throw new InvalidArgumentException('Reported message sender could not be resolved.');
            }

            $this->enforcement->suspendReportedUser($sender, $admin, $resolutionNote);
            $this->deleteReportedMessage($report);
            $actionTaken = 'suspend_account';
        } elseif ($actionTaken === 'delete_message') {
            $this->deleteReportedMessage($report);
        }

        $report->update([
            'status' => $nextStatus,
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
            'resolution_note' => $resolutionNote,
            'action_taken' => $actionTaken,
        ]);

        $freshReport = $report->fresh(['conversation', 'message.sender', 'reporter']);
        $this->reportNotifications->notifyReportResolved($freshReport);

        return $freshReport;
    }

    private function deleteReportedMessage(ChatMessageReport $report): void
    {
        $message = $report->message;
        if (! $message instanceof Message || $message->deleted_at !== null) {
            return;
        }

        $message->update([
            'body' => null,
            'deleted_at' => now(),
        ]);

        $this->realtime->messageUpdated($message->fresh(['sender', 'attachments']));
    }

    private function encodeCursor(Message $message): string
    {
        $createdAt = $message->created_at?->format('Y-m-d H:i:s.u') ?? '';

        return base64_encode($createdAt.'|'.$message->id);
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function decodeCursor(string $cursor): array
    {
        $decoded = base64_decode($cursor, true);
        if ($decoded === false || ! str_contains($decoded, '|')) {
            throw new InvalidArgumentException(__('diyar.chat.invalid_cursor'));
        }

        [$createdAt, $id] = explode('|', $decoded, 2);

        return [$createdAt, $id];
    }
}
