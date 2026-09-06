<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\ConversationParticipant;
use App\Models\Message;
use App\Models\User;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class MessageCreated implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Message $message,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->message->loadMissing(['sender', 'conversation']);

        $recipients = ConversationParticipant::query()
            ->where('conversation_id', $this->message->conversation_id)
            ->whereNull('left_at')
            ->where('user_id', '!=', $this->message->sender_id)
            ->with('user')
            ->get()
            ->map(fn (ConversationParticipant $participant) => $participant->user)
            ->filter(fn (?User $user) => $user !== null)
            ->values()
            ->all();

        $senderName = (string) ($this->message->sender?->name ?? '');
        $preview = mb_substr((string) ($this->message->body ?? ''), 0, 120);
        $frontendUrl = rtrim((string) config('diyar.frontend_url'), '/');

        return new NotificationIntent(
            type: NotificationType::ChatMessageReceived,
            recipients: $recipients,
            payload: [
                'sender_name' => $senderName,
                'preview' => $preview,
                'conversation_id' => $this->message->conversation_id,
                'action_url' => "{$frontendUrl}/chat?conversation={$this->message->conversation_id}",
            ],
            entityType: 'conversation',
            entityId: $this->message->conversation_id,
            dedupeKey: "chat.message:{$this->message->id}",
        );
    }
}
