<?php

namespace App\Services\Notifications;

use App\Enums\NotificationType;
use App\Models\User;

final class NotificationIntent
{
    /**
     * @param  list<User>  $recipients
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        public readonly NotificationType $type,
        public readonly array $recipients,
        public readonly array $payload,
        public readonly ?string $entityType = null,
        public readonly ?string $entityId = null,
        public readonly ?string $dedupeKey = null,
    ) {}
}
