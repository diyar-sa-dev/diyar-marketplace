<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use App\Enums\RoleName;
use App\Enums\UserStatus;
use App\Models\User;
use App\Services\Cart\CartService;
use App\Support\Identity\MarketplaceAccess;
use App\Support\User\UserNotificationPreferences;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Session\Session;
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
        return $this->establishMarketplaceSession($user, $remember);
    }

    public function establishMarketplaceSession(User $user, bool $remember = false): User
    {
        $guard = Auth::guard('web');

        $this->rememberGuestCartSessionBeforeLogin();

        if (! $guard->check() || (string) $guard->id() !== (string) $user->getAuthIdentifier()) {
            $guard->login($user, remember: $remember);
            $this->regenerateSessionForContextLogin('admin');
        }

        $user = $user->load('roles');
        $this->welcomeEmail->sendIfEligible(
            $user,
            UserNotificationPreferences::mailLocale($user, App::getLocale()),
        );

        return $user;
    }

    public function establishAdminSession(User $user, bool $remember = false): User
    {
        $guard = Auth::guard('admin');

        if (! $guard->check() || (string) $guard->id() !== (string) $user->getAuthIdentifier()) {
            $guard->login($user, remember: $remember);
            $this->regenerateSessionForContextLogin('web');
        }

        return $user->load('roles');
    }

    private function regenerateSessionForContextLogin(string $otherGuard): void
    {
        if (! request()->hasSession()) {
            return;
        }

        $session = request()->session();

        if (Auth::guard($otherGuard)->check()) {
            $session->regenerateToken();
            $session->save();

            return;
        }

        $session->put(CartService::GUEST_SESSION_FOR_MERGE_KEY, $session->getId());
        $session->regenerate();
    }

    private function rememberGuestCartSessionBeforeLogin(): void
    {
        if (! request()->hasSession()) {
            return;
        }

        $session = request()->session();

        if (! $session->isStarted() || Auth::guard('web')->check()) {
            return;
        }

        $session->put(CartService::GUEST_SESSION_FOR_MERGE_KEY, $session->getId());
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

    public function loginForAdminWithPhone(string $phoneRaw, string $password, bool $remember = false): User
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            $this->hitRateLimiter('phone', $phoneRaw);
            throw ValidationException::withMessages([
                'credentials' => [__('auth.failed')],
            ]);
        }

        return $this->attemptForAdminPanel(['phone' => $phone, 'password' => $password], 'phone', $phoneRaw, $remember);
    }

    public function loginForAdminWithEmail(string $email, string $password, bool $remember = false): User
    {
        return $this->attemptForAdminPanel(
            ['email' => strtolower(trim($email)), 'password' => $password],
            'email',
            strtolower(trim($email)),
            $remember,
        );
    }

    public function logout(): void
    {
        $this->logoutMarketplace();
    }

    public function logoutMarketplace(): void
    {
        $adminUser = Auth::guard('admin')->user();

        Auth::guard('web')->logout();

        if (! request()->hasSession()) {
            return;
        }

        $session = request()->session();

        if ($adminUser !== null) {
            Auth::guard('admin')->login($adminUser);
            $this->forgetWebSessionKeys($session);
            $session->regenerateToken();
            $session->save();

            return;
        }

        $session->invalidate();
        $session->regenerateToken();
    }

    public function logoutAdmin(): void
    {
        $marketplaceUser = Auth::guard('web')->user();

        Auth::guard('admin')->logout();

        if (! request()->hasSession()) {
            return;
        }

        $session = request()->session();

        if ($marketplaceUser !== null) {
            Auth::guard('web')->login($marketplaceUser);
            $this->forgetAdminSessionKeys($session);
            $session->regenerateToken();
            $session->save();

            return;
        }

        $session->invalidate();
        $session->regenerateToken();
    }

    /**
     * @param  Session  $session
     */
    private function forgetWebSessionKeys($session): void
    {
        Auth::guard('web')->forgetUser();

        foreach (array_keys($session->all()) as $key) {
            if (str_starts_with($key, 'login_web_')) {
                $session->forget($key);
            }
        }

        $session->forget('password_hash_web');
    }

    /**
     * @param  Session  $session
     */
    private function forgetAdminSessionKeys($session): void
    {
        Auth::guard('admin')->forgetUser();

        foreach (array_keys($session->all()) as $key) {
            if (str_starts_with($key, 'login_admin_')) {
                $session->forget($key);
            }
        }

        $session->forget('password_hash_admin');
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function attempt(array $credentials, string $key, string $identifier, bool $remember = false): User
    {
        $this->ensureIsNotRateLimited($key, $identifier);

        $this->rememberGuestCartSessionBeforeLogin();

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

        if (! MarketplaceAccess::canAccessMarketplace($user)) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'credentials' => [__('auth.failed')],
            ]);
        }

        return $this->establishMarketplaceSession($user, $remember);
    }

    /**
     * @param  array<string, mixed>  $credentials
     */
    private function attemptForAdminPanel(array $credentials, string $key, string $identifier, bool $remember = false): User
    {
        $this->ensureIsNotRateLimited($key, $identifier);

        if (! Auth::guard('admin')->attempt($credentials, remember: $remember)) {
            RateLimiter::hit($this->throttleKey($key, $identifier), decaySeconds: $this->decaySeconds());
            throw ValidationException::withMessages([
                'credentials' => [__('auth.failed')],
            ]);
        }

        RateLimiter::clear($this->throttleKey($key, $identifier));

        /** @var User $user */
        $user = Auth::guard('admin')->user();

        if (! $user->isActive()) {
            Auth::guard('admin')->logout();

            throw ValidationException::withMessages([
                'credentials' => [match ($user->status) {
                    UserStatus::Suspended, UserStatus::Rejected => __('account.suspended'),
                    default => __('auth.failed'),
                }],
            ]);
        }

        if (! MarketplaceAccess::canAccessAdminPanel($user)) {
            Auth::guard('admin')->logout();

            throw ValidationException::withMessages([
                'credentials' => [__('auth.failed')],
            ]);
        }

        return $this->establishAdminSession($user, $remember);
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
