<?php

namespace App\Services\Identity;

use App\Contracts\Identity\OtpCodeGenerator;
use InvalidArgumentException;

final class SecureOtpCodeGenerator implements OtpCodeGenerator
{
    public function generate(int $length): string
    {
        if ($length < 4 || $length > 8) {
            throw new InvalidArgumentException('OTP length must be between 4 and 8.');
        }

        $max = (10 ** $length) - 1;

        return str_pad((string) random_int(0, $max), $length, '0', STR_PAD_LEFT);
    }
}
