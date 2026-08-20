<?php

namespace App\Listeners\Chat;

use App\Events\Domain\MessageCreated;
use App\Services\Chat\ChatRealtimeBroadcaster;

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
