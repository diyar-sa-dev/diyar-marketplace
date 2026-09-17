<?php

namespace App\Services\Security;

use App\Enums\OtpPurpose;
use App\Models\User;
use App\Services\Identity\OtpService;
use App\Services\Identity\PhoneNormalizer;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

final class TwoFactorService
{
    public function __construct(
        private readonly OtpService $otp,
    ) {}

    /**
     * @return array{enabled: bool, confirmed_at: string|null, phone_masked: string|null}
     */
    public function status(User $user): array
    {
        return [
            'enabled' => $user->hasTwoFactorEnabled(),
            'confirmed_at' => $user->two_factor_confirmed_at?->toIso8601String(),
            'phone_masked' => PhoneNormalizer::toNational($user->phone),
        ];
    }

    public function beginEnrollment(User $user): void
    {
        if (! config('diyar.two_factor.enabled', true)) {
            throw ValidationException::withMessages([
                'two_factor' => [__('diyar.two_factor.unavailable')],
            ]);
        }

        if ($user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages([
                'two_factor' => [__('diyar.two_factor.already_enabled')],
            ]);
        }

        if ($user->phone_verified_at === null) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.two_factor.phone_required')],
            ]);
        }

        $this->issueSetupOtp($user, ['action' => 'enable']);
    }

    public function confirmEnrollment(User $user, string $code): void
    {
        $state = $this->otp->verify($user->phone, OtpPurpose::TwoFactorSetup, $code);
        $action = is_array($state['metadata'] ?? null) ? ($state['metadata']['action'] ?? null) : null;

        if ($action !== 'enable') {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $user->forceFill([
            'two_factor_enabled' => true,
            'two_factor_confirmed_at' => now(),
        ])->save();

        Log::info('2fa.enabled', ['user_id' => $user->id]);
    }

    public function beginDisable(User $user, string $password): void
    {
        if (! $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages([
                'two_factor' => [__('diyar.two_factor.not_enabled')],
            ]);
        }

        if (! Hash::check($password, (string) $user->password)) {
            throw ValidationException::withMessages([
                'password' => [__('diyar.two_factor.invalid_password')],
            ]);
        }

        $this->issueSetupOtp($user, ['action' => 'disable']);
    }

    public function confirmDisable(User $user, string $code): void
    {
        if (! $user->hasTwoFactorEnabled()) {
            throw ValidationException::withMessages([
                'two_factor' => [__('diyar.two_factor.not_enabled')],
            ]);
        }

        $state = $this->otp->verify($user->phone, OtpPurpose::TwoFactorSetup, $code);
        $action = is_array($state['metadata'] ?? null) ? ($state['metadata']['action'] ?? null) : null;

        if ($action !== 'disable') {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $user->forceFill([
            'two_factor_enabled' => false,
            'two_factor_confirmed_at' => null,
        ])->save();

        Log::info('2fa.disabled', ['user_id' => $user->id]);
    }

    /**
     * @param  array<string, mixed>  $metadata
     */
    private function issueSetupOtp(User $user, array $metadata): void
    {
        $existing = $this->otp->peek($user->phone, OtpPurpose::TwoFactorSetup);

        if ($existing !== null) {
            $existingAction = is_array($existing['metadata'] ?? null)
                ? ($existing['metadata']['action'] ?? null)
                : null;
            $newAction = $metadata['action'] ?? null;

            if ($existingAction === $newAction) {
                try {
                    $this->otp->resend($user->phone, OtpPurpose::TwoFactorSetup);

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
        }

        $this->otp->issue(
            phone: $user->phone,
            purpose: OtpPurpose::TwoFactorSetup,
            userId: $user->id,
            metadata: $metadata,
        );
    }
}
