<?php

use App\Models\User;
use App\Services\Chat\ChatAuthorizationService;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('users.{userId}', function (?User $user, string $userId): bool {
    if ($user === null) {
        return false;
    }

    return hash_equals((string) $user->getAuthIdentifier(), (string) $userId);
});

Broadcast::channel('conversations.{conversationId}', function (?User $user, string $conversationId): bool {
    if ($user === null) {
        return false;
    }

    return app(ChatAuthorizationService::class)->canSubscribe($user, $conversationId);
});
