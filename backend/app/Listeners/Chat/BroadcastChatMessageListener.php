<?php

namespace App\Listeners\Chat;

use App\Domains\Chat\Services\ChatRealtimeBroadcaster;
use App\Events\Domain\MessageCreated;

final class BroadcastChatMessageListener
{
    public function __construct(
        private readonly ChatRealtimeBroadcaster $realtime,
    ) {}

    public function handle(MessageCreated $event): void
    {
        $this->realtime->messageCreated($event->message);
    }
}
