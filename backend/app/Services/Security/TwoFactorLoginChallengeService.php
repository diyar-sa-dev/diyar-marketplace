<?php

namespace App\Services\Security;

use App\Enums\OtpPurpose;
use App\Models\User;
use App\Services\Identity\OtpService;
use App\Services\Identity\PhoneNormalizer;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

final class TwoFactorLoginChallengeService
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly TwoFactorChallengeStore $challenges,
    ) {}

    /**
     * @return never
     */
    public function begin(User $user, bool $remember): void
    {
        Auth::guard('web')->logout();

        $challengeId = $this->challenges->create((string) $user->id, $remember);
        $this->issueLoginOtp($user);

        Log::info('2fa.login.challenge', [
            'user_id' => $user->id,
            'challenge_id' => $challengeId,
        ]);

        throw ValidationException::withMessages([
            'two_factor_required' => [__('diyar.two_factor.required')],
            'challenge_id' => [$challengeId],
            'verification_phone' => [PhoneNormalizer::toNational($user->phone) ?? ''],
        ]);
    }

    /**
     * @return array{user: User, remember: bool}
     */
    public function verify(string $challengeId, string $code): array
    {
        $challenge = $this->challenges->peek($challengeId);

        if ($challenge === null) {
            throw ValidationException::withMessages([
                'challenge_id' => [__('diyar.two_factor.challenge_expired')],
            ]);
        }

        /** @var User|null $user */
        $user = User::query()->find($challenge['user_id']);

        if ($user === null || ! $user->isActive() || ! $user->hasTwoFactorEnabled()) {
            $this->challenges->consume($challengeId);

            throw ValidationException::withMessages([
                'challenge_id' => [__('diyar.two_factor.challenge_expired')],
            ]);
        }

        $this->otp->verify($user->phone, OtpPurpose::Login, $code);

        $consumed = $this->challenges->consume($challengeId);

        if ($consumed === null) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.already_used')],
            ]);
        }

        Log::info('2fa.login.success', ['user_id' => $user->id]);

        return [
            'user' => $user,
            'remember' => (bool) ($consumed['remember'] ?? false),
        ];
    }

    public function resend(string $challengeId): void
    {
        $challenge = $this->challenges->peek($challengeId);

        if ($challenge === null) {
            throw ValidationException::withMessages([
                'challenge_id' => [__('diyar.two_factor.challenge_expired')],
            ]);
        }

        /** @var User|null $user */
        $user = User::query()->find($challenge['user_id']);

        if ($user === null || ! $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages([
                'challenge_id' => [__('diyar.two_factor.challenge_expired')],
            ]);
        }

        $this->otp->resend($user->phone, OtpPurpose::Login);
    }

    private function issueLoginOtp(User $user): void
    {
        $existing = $this->otp->peek($user->phone, OtpPurpose::Login);

        if ($existing !== null) {
            try {
                $this->otp->resend($user->phone, OtpPurpose::Login);

                return;
            } catch (ValidationException $exception) {
                $ignorable = [
                    __('diyar.otp.cooldown'),
                    __('diyar.otp.too_many_resends'),
                ];

                foreach ($exception->errors()['phone'] ?? [] as $message) {
                    if (in_array($message, $ignorable, true)) {
                        return;
                    }
                }

                throw $exception;
            }
        }

        $this->otp->issue(
            phone: $user->phone,
            purpose: OtpPurpose::Login,
            userId: $user->id,
            metadata: ['flow' => 'login'],
        );
    }
}
