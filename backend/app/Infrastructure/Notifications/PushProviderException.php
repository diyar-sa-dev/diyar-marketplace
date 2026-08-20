<?php

namespace App\Infrastructure\Notifications;

use RuntimeException;

final class PushProviderException extends RuntimeException
{
    public function __construct(
        string $message,
        public readonly bool $permanent = false,
        public readonly bool $rateLimited = false,
    ) {
        parent::__construct($message);
    }
}
