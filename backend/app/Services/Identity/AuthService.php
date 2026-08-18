<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\User;
use App\Support\User\UserNotificationPreferences;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class AuthService
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly EmailOtpService $emailOtp,
        private readonly WelcomeEmailService $welcomeEmail,
    ) {}

    public function establishSession(User $user, bool $remember = false): User
    {
        Auth::guard('web')->login($user, remember: $remember);

        if (request()->hasSession()) {
            request()->session()->regenerate();
        }

        $user = $user->load('roles');
        $this->welcomeEmail->sendIfEligible(
            $user,
            UserNotificationPreferences::mailLocale($user, App::getLocale()),
        );

        return $user;
    }

    public function loginWithPhone(string $phoneRaw, string $password, bool $remember = false): User
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            $this->hitRateLimiter('phone', $phoneRaw);
            throw ValidationException::withMessages([
                'credentials' => [__('auth.failed')],
            ]);
        }

        return $this->attempt(['phone' => $phone, 'password' => $password], 'phone', $phoneRaw, $remember);
    }

    public function loginWithEmail(string $email, string $password, bool $remember = false): User
    {
        return $this->attempt(
            ['email' => strtolower(trim($email)), 'password' => $password],
            'email',
            strtolower(trim($email)),
            $remember,
        );
    }

    public function logout(): void
    {
        Auth::guard('web')->logout();

        if (request()->hasSession()) {
            request()->session()->invalidate();
            request()->session()->regenerateToken();
        }
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function attempt(array $credentials, string $key, string $identifier, bool $remember = false): User
    {
        $this->ensureIsNotRateLimited($key, $identifier);

        if (! Auth::guard('web')->attempt($credentials, remember: $remember)) {
            RateLimiter::hit($this->throttleKey($key, $identifier), decaySeconds: $this->decaySeconds());
            throw ValidationException::withMessages([
                'credentials' => [__('auth.failed')],
            ]);
        }

        RateLimiter::clear($this->throttleKey($key, $identifier));

        /** @var User $user */
        $user = Auth::guard('web')->user();

        if (! $user->isActive()) {
            if ($user->status === UserStatus::Pending) {
                $this->beginPhoneVerification($user);
            }

            Auth::guard('web')->logout();

            $message = match ($user->status) {
                UserStatus::Suspended, UserStatus::Rejected => __('account.suspended'),
                default => $user->phone_verified_at === null
                    ? __('account.not_verified')
                    : __('auth.failed'),
            };

            throw ValidationException::withMessages([
                'credentials' => [$message],
            ]);
        }

        if ($key === 'email' && $this->requiresEmailVerification($user)) {
            $this->beginEmailVerification($user, $remember);
        }

        return $this->establishSession($user, $remember);
    }

    private function requiresEmailVerification(User $user): bool
    {
        return $user->email !== null
            && trim($user->email) !== ''
            && $user->email_verified_at === null;
    }

    /**
     * @return never
     */
    private function beginEmailVerification(User $user, bool $remember): void
    {
        Auth::guard('web')->logout();

        $email = strtolower(trim((string) $user->email));
        $locale = App::getLocale();
        $existing = $this->emailOtp->peek($email, OtpPurpose::EmailVerification);

        if ($existing !== null) {
            try {
                $this->emailOtp->resend($email, OtpPurpose::EmailVerification, $user->name, $locale);
            } catch (ValidationException $exception) {
                $emailErrors = $exception->errors()['email'] ?? [];
                $ignorable = [
                    __('diyar.otp.cooldown'),
                    __('diyar.otp.too_many_resends'),
                ];

                foreach ($emailErrors as $message) {
                    if (in_array($message, $ignorable, true)) {
                        return;
                    }
                }

                throw $exception;
            }
        } else {
            $this->emailOtp->issue(
                email: $email,
                purpose: OtpPurpose::EmailVerification,
                userId: $user->id,
                recipientName: $user->name,
                locale: $locale,
                metadata: ['remember' => $remember],
            );
        }

        throw ValidationException::withMessages([
            'email_verification_required' => [__('diyar.auth.email_verification_required')],
            'verification_email' => [$email],
        ]);
    }

    /**
     * @return never
     */
    private function beginPhoneVerification(User $user): void
    {
        Auth::guard('web')->logout();

        $this->ensureRegistrationVerificationOtp($user);

        throw ValidationException::withMessages([
            'phone_verification_required' => [__('diyar.auth.phone_verification_required')],
            'verification_phone' => [PhoneNormalizer::toNational($user->phone) ?? ''],
        ]);
    }

    private function ensureRegistrationVerificationOtp(User $user): void
    {
        $phone = $user->phone;
        $existing = $this->otp->peek($phone, OtpPurpose::Registration);

        if ($existing !== null) {
            try {
                $this->otp->resend($phone, OtpPurpose::Registration);
            } catch (ValidationException $exception) {
                $phoneErrors = $exception->errors()['phone'] ?? [];
                $ignorable = [
                    __('diyar.otp.cooldown'),
                    __('diyar.otp.too_many_resends'),
                ];

                foreach ($phoneErrors as $message) {
                    if (in_array($message, $ignorable, true)) {
                        return;
                    }
                }

                throw $exception;
            }

            return;
        }

        $this->otp->issue(
            phone: $phone,
            purpose: OtpPurpose::Registration,
            userId: $user->id,
            metadata: ['role_keys' => [RoleName::Customer->value]],
        );
    }

    private function ensureIsNotRateLimited(string $key, string $identifier): void
    {
        $throttleKey = $this->throttleKey($key, $identifier);

        if (! RateLimiter::tooManyAttempts($throttleKey, $this->maxAttempts())) {
            return;
        }

        event(new Lockout(request()));

        $seconds = RateLimiter::availableIn($throttleKey);

        throw ValidationException::withMessages([
            'credentials' => [__('auth.throttle', ['seconds' => $seconds])],
        ]);
    }

    private function hitRateLimiter(string $key, string $identifier): void
    {
        RateLimiter::hit($this->throttleKey($key, $identifier), decaySeconds: $this->decaySeconds());
    }

    private function throttleKey(string $key, string $identifier): string
    {
        return Str::transliterate(Str::lower($key.'|'.$identifier.'|'.request()->ip()));
    }

    private function maxAttempts(): int
    {
        return (int) config('diyar.auth.login_max_attempts', 5);
    }

    private function decaySeconds(): int
    {
        return (int) config('diyar.auth.login_decay_minutes', 15) * 60;
    }
}
