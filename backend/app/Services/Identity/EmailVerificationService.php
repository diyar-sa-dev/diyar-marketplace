<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use App\Models\User;
use Illuminate\Validation\ValidationException;

final class EmailVerificationService
{
    public function __construct(
        private readonly EmailOtpService $emailOtp,
        private readonly AuthService $auth,
        private readonly WelcomeEmailService $welcomeEmail,
    ) {}

    public function requestForUser(User $user, string $locale = 'ar'): void
    {
        $email = $this->requireUnverifiedEmail($user);

        $this->emailOtp->issue(
            email: $email,
            purpose: OtpPurpose::EmailVerification,
            userId: $user->id,
            recipientName: $user->name,
            locale: $locale,
        );
    }

    public function resendForUser(User $user, string $locale = 'ar'): void
    {
        $email = $this->requireUnverifiedEmail($user);

        $this->emailOtp->resend(
            email: $email,
            purpose: OtpPurpose::EmailVerification,
            recipientName: $user->name,
            locale: $locale,
        );
    }

    public function verifyForUser(User $user, string $code): User
    {
        $email = $this->requireUnverifiedEmail($user);

        $state = $this->emailOtp->verify($email, OtpPurpose::EmailVerification, $code);

        if (($state['user_id'] ?? null) !== $user->id) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $user->forceFill(['email_verified_at' => now()])->save();

        $fresh = $user->fresh('roles');
        $this->welcomeEmail->sendIfEligible($fresh, app()->getLocale());

        return $fresh;
    }

    public function verifyForLogin(string $email, string $code, bool $remember = false): User
    {
        $normalizedEmail = strtolower(trim($email));
        $user = User::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail])->first();

        if ($user === null || ! $user->isActive() || $user->email === null) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $state = $this->emailOtp->verify($normalizedEmail, OtpPurpose::EmailVerification, $code);

        if (($state['user_id'] ?? null) !== $user->id) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $remember = (bool) ($state['metadata']['remember'] ?? false);

        $user->forceFill(['email_verified_at' => now()])->save();

        return $this->auth->establishSession($user->fresh('roles'), $remember);
    }

    public function resendForLogin(string $email, string $locale = 'ar'): void
    {
        $normalizedEmail = strtolower(trim($email));
        $user = User::query()->whereRaw('LOWER(email) = ?', [$normalizedEmail])->first();

        if ($user === null || ! $user->isActive() || $user->email === null || $user->email_verified_at !== null) {
            throw ValidationException::withMessages([
                'email' => [__('diyar.otp.invalid_request')],
            ]);
        }

        $this->emailOtp->resend(
            email: $normalizedEmail,
            purpose: OtpPurpose::EmailVerification,
            recipientName: $user->name,
            locale: $locale,
        );
    }

    private function requireUnverifiedEmail(User $user): string
    {
        if ($user->email === null || trim($user->email) === '') {
            throw ValidationException::withMessages([
                'email' => [__('diyar.profile.email_required_for_verification')],
            ]);
        }

        if ($user->email_verified_at !== null) {
            throw ValidationException::withMessages([
                'email' => [__('diyar.profile.email_already_verified')],
            ]);
        }

        return strtolower(trim($user->email));
    }
}
