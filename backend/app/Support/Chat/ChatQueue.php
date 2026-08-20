<?php

namespace App\Support\Chat;

final class ChatQueue
{
    public static function archive(): string
    {
        $queue = config('diyar.chat.queues.archive');

        return is_string($queue) && $queue !== '' ? $queue : 'chat-low';
    }
}
