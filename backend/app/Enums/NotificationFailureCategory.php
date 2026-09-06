<?php

namespace App\Enums;

enum NotificationFailureCategory: string
{
    case Transient = 'transient';
    case RateLimited = 'rate_limited';
    case Timeout = 'timeout';
    case ProviderUnavailable = 'provider_unavailable';
    case InvalidRecipient = 'invalid_recipient';
    case AuthenticationFailure = 'authentication_failure';
    case PayloadInvalid = 'payload_invalid';
    case CircuitOpen = 'circuit_open';
    case Permanent = 'permanent';
    case Unknown = 'unknown';

    public function isRetryable(): bool
    {
        return in_array($this, [
            self::Transient,
            self::RateLimited,
            self::Timeout,
            self::ProviderUnavailable,
            self::CircuitOpen,
            self::Unknown,
        ], true);
    }
}
