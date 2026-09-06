<?php

namespace App\Services\Chat;

use App\Enums\ChatMessageReportStatus;
use App\Models\ChatMessageReport;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use App\Support\Chat\ChatReportCatalog;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

final class ChatModerationService
{
    public function __construct(
        private readonly ChatAuthorizationService $authorization,
    ) {}

    public function reportMessage(
        User $reporter,
        Conversation $conversation,
        Message $message,
        string $reason,
        ?string $details = null,
    ): ChatMessageReport {
        $this->authorization->ensureParticipant($reporter, $conversation);

        if ($message->conversation_id !== $conversation->id) {
            throw new InvalidArgumentException('Message does not belong to this conversation.');
        }

        if (ChatMessageReport::query()
            ->where('message_id', $message->id)
            ->where('reporter_id', $reporter->id)
            ->exists()) {
            throw new ConflictHttpException(__('diyar.chat.message_already_reported'));
        }

        return ChatMessageReport::query()->create([
            'conversation_id' => $conversation->id,
            'message_id' => $message->id,
            'reporter_id' => $reporter->id,
            'reason' => $reason,
            'details' => $details,
            'status' => ChatMessageReportStatus::Pending,
        ]);
    }

    /** @return list<array{value: string, label: string}> */
    public function localizedReasons(?string $locale = null): array
    {
        return ChatReportCatalog::localizedReasons($locale);
    }
}
