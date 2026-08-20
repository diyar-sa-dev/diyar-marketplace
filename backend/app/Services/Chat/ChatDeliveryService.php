<?php

namespace App\Services\Chat;

use App\Models\Conversation;
use App\Models\ConversationParticipant;
use App\Models\User;

final class ChatDeliveryService
{
    public function markDelivered(User $user, Conversation $conversation): void
    {
        ConversationParticipant::query()
            ->where('conversation_id', $conversation->id)
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->update(['last_delivered_at' => now()]);
    }
}
