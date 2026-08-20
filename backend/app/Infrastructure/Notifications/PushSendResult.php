<?php

namespace App\Infrastructure\Notifications;

final class PushSendResult
{
    /**
     * @param  list<string>  $invalidDeviceIds
     */
    public function __construct(
        public readonly array $invalidDeviceIds = [],
        public readonly bool $rateLimited = false,
    ) {}
}
