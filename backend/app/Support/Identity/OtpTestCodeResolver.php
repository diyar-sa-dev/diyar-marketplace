<?php

namespace App\Support\Identity;

use App\Contracts\Identity\OtpCodeGenerator;

final class OtpTestCodeResolver
{
    public static function resolve(int $length, OtpCodeGenerator $generator, bool $forceRandom = false): string
    {
        if ($forceRandom || ! self::testModeEnabled()) {
            return $generator->generate($length);
        }

        return self::testCodeOrNull($length) ?? $generator->generate($length);
    }

    public static function testCodeOrNull(int $length): ?string
    {
        if (! self::testModeEnabled()) {
            return null;
        }

        $testCode = trim((string) config('diyar.otp.test_code', ''));

        if ($length === 6 && strlen($testCode) === 6 && ctype_digit($testCode)) {
            return $testCode;
        }

        return null;
    }

    public static function testModeEnabled(): bool
    {
        if (! app()->environment(['local', 'testing'])) {
            return false;
        }

        return (bool) config('diyar.otp.test_mode', false);
    }
}
