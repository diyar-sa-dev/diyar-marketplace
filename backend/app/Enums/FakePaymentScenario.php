<?php

namespace App\Enums;

enum FakePaymentScenario: string
{
    case Success = 'success';
    case Fail = 'fail';
    case Processing = 'processing';
    case RequiresAction = 'requires_action';
    case Timeout = 'timeout';
    case RateLimited = 'rate_limited';
    case ProviderError = 'provider_error';
    case UnknownResult = 'unknown_result';
    case WebhookDelay = 'webhook_delay';
    case WebhookDuplicate = 'webhook_duplicate';
    case WebhookOutOfOrder = 'webhook_out_of_order';

    public static function tryFromConfig(?string $value): self
    {
        if ($value === null || $value === '') {
            return self::Success;
        }

        return self::tryFrom(strtolower($value)) ?? self::Success;
    }
}
