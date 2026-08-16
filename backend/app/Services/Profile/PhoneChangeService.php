<?php

namespace App\Services\Profile;

use App\Enums\OtpPurpose;
use App\Models\User;
use App\Services\Identity\OtpService;
use App\Services\Identity\PhoneNormalizer;
use Illuminate\Validation\ValidationException;

final class PhoneChangeService
{
    public function __construct(
        private readonly OtpService $otp,
    ) {}

    public function requestChange(User $user, string $newPhoneRaw): void
    {
        $phone = $this->normalizeOrFail($newPhoneRaw);

        if ($phone === $user->phone) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.profile.phone_same_as_current')],
            ]);
        }

        if ($this->phoneTakenByAnotherUser($phone, $user->id)) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.registration.phone_taken')],
            ]);
        }

        $this->otp->issue(
            phone: $phone,
            purpose: OtpPurpose::PhoneChange,
            userId: $user->id,
            metadata: ['previous_phone' => $user->phone],
        );
    }

    public function resendChange(User $user, string $newPhoneRaw): void
    {
        $phone = $this->normalizeOrFail($newPhoneRaw);
        $active = $this->otp->peek($phone, OtpPurpose::PhoneChange);

        if ($active === null || ($active['user_id'] ?? null) !== $user->id) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.otp.invalid_request')],
            ]);
        }

        $this->otp->resend($phone, OtpPurpose::PhoneChange);
    }

    public function verifyAndApply(User $user, string $newPhoneRaw, string $code): User
    {
        $phone = $this->normalizeOrFail($newPhoneRaw);
        $state = $this->otp->verify($phone, OtpPurpose::PhoneChange, $code);

        if (($state['user_id'] ?? null) !== $user->id) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        if ($this->phoneTakenByAnotherUser($phone, $user->id)) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.registration.phone_taken')],
            ]);
        }

        $user->forceFill([
            'phone' => $phone,
            'phone_verified_at' => now(),
        ])->save();

        return $user->fresh('roles');
    }

    private function normalizeOrFail(string $phoneRaw): string
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);

        if ($phone === null) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.registration.invalid_phone')],
            ]);
        }

        return $phone;
    }

    private function phoneTakenByAnotherUser(string $phone, string $userId): bool
    {
        return User::query()
            ->where('phone', $phone)
            ->where('id', '!=', $userId)
            ->exists();
    }
}
