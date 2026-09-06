<?php

namespace App\Support\Identity;

use App\Contracts\Identity\OtpCodeGenerator;

final class OtpTestCodeResolver
{
    public static function resolve(int $length, OtpCodeGenerator $generator, bool $forceRandom = false): string
    {
        if ($forceRandom) {
            return $generator->generate($length);
        }

        $testCode = trim((string) config('diyar.otp.test_code', ''));

        if (
            ! app()->environment('production')
            && $length === 6
            && strlen($testCode) === 6
            && ctype_digit($testCode)
        ) {
            return $testCode;
        }

        return $generator->generate($length);
    }
}
