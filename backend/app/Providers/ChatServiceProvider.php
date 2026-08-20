<?php

namespace App\Providers;

use App\Events\Domain\MessageCreated;
use App\Listeners\Chat\BroadcastChatMessageListener;
use App\Listeners\Chat\InvalidateChatCacheListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

final class ChatServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(MessageCreated::class, BroadcastChatMessageListener::class);
        Event::listen(MessageCreated::class, InvalidateChatCacheListener::class);
    }
}
