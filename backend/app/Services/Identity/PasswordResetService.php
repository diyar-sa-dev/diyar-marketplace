<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use App\Enums\UserStatus;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class PasswordResetService
{
    public function __construct(
        private readonly OtpService $otp,
    ) {}

    public function requestReset(string $phoneRaw): void
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);

        if ($phone === null) {
            return;
        }

        $user = User::query()->where('phone', $phone)->first();

        if ($user === null || $user->status !== UserStatus::Active) {
            return;
        }

        $this->otp->issue($phone, OtpPurpose::PasswordRecovery, userId: $user->id);
    }

    public function reset(string $phoneRaw, string $code, string $password): User
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $this->otp->verify($phone, OtpPurpose::PasswordRecovery, $code);

        $user = User::query()->where('phone', $phone)->firstOrFail();

        $user->forceFill([
            'password' => $password,
        ])->save();

        return $user;
    }

    public function verifyCode(string $phoneRaw, string $code): void
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $this->otp->assertValid($phone, OtpPurpose::PasswordRecovery, $code);
    }
}
