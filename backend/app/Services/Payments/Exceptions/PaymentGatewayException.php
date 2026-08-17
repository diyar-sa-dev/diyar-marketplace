<?php

namespace App\Services\Payments\Exceptions;

use RuntimeException;

final class PaymentGatewayException extends RuntimeException
{
    public static function configuration(string $message): self
    {
        return new self($message);
    }

    public static function operationFailed(string $message): self
    {
        return new self($message);
    }
}
