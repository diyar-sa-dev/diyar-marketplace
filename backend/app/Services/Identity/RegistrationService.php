<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Models\ProviderAccount;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class RegistrationService
{
    public function __construct(
        private readonly OtpService $otp,
        private readonly AuthService $auth,
    ) {}

    /**
     * @param  list<string>  $roleKeys
     */
    public function register(
        string $name,
        string $phoneRaw,
        ?string $email,
        string $password,
        array $roleKeys,
    ): User {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.registration.invalid_phone')],
            ]);
        }

        $existingByPhone = User::query()->where('phone', $phone)->first();

        if ($existingByPhone !== null && $existingByPhone->status !== UserStatus::Pending) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.registration.phone_taken')],
            ]);
        }

        if ($email !== null) {
            $existingByEmail = User::query()->where('email', $email)->first();

            if ($existingByEmail !== null && $existingByEmail->id !== $existingByPhone?->id) {
                throw ValidationException::withMessages([
                    'email' => [__('diyar.registration.email_taken')],
                ]);
            }
        }

        $validatedRoleKeys = $this->validateRoleKeys($roleKeys);

        $user = DB::transaction(function () use ($existingByPhone, $name, $phone, $email, $password) {
            if ($existingByPhone !== null) {
                $existingByPhone->forceFill([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password,
                    'email_verified_at' => null,
                ])->save();

                return $existingByPhone->fresh();
            }

            return User::query()->create([
                'name' => $name,
                'phone' => $phone,
                'email' => $email,
                'password' => $password,
                'status' => UserStatus::Pending,
                'email_verified_at' => null,
            ]);
        });

        $this->otp->issue(
            phone: $phone,
            purpose: OtpPurpose::Registration,
            userId: $user->id,
            metadata: ['role_keys' => $validatedRoleKeys],
        );

        return $user;
    }

    public function resendRegistrationOtp(string $phoneRaw): void
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.otp.invalid_request')],
            ]);
        }

        $user = User::query()->where('phone', $phone)->first();

        if ($user === null || $user->status !== UserStatus::Pending) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.otp.invalid_request')],
            ]);
        }

        $this->otp->resend($phone, OtpPurpose::Registration);
    }

    public function verifyRegistration(string $phoneRaw, string $code): User
    {
        $phone = PhoneNormalizer::normalize($phoneRaw);
        if ($phone === null) {
            throw ValidationException::withMessages([
                'phone' => [__('diyar.registration.invalid_phone')],
            ]);
        }

        $user = User::query()->where('phone', $phone)->first();

        if ($user === null || $user->status !== UserStatus::Pending) {
            throw ValidationException::withMessages([
                'code' => [__('diyar.otp.invalid')],
            ]);
        }

        $otpState = $this->otp->verify($phone, OtpPurpose::Registration, $code);
        $roleKeys = is_array($otpState['metadata']['role_keys'] ?? null)
            ? $otpState['metadata']['role_keys']
            : [RoleName::Customer->value];

        $user = DB::transaction(function () use ($user, $roleKeys) {
            $user = User::query()->whereKey($user->id)->lockForUpdate()->firstOrFail();

            if ($user->status === UserStatus::Active) {
                return $user->load('roles');
            }

            if ($user->status !== UserStatus::Pending) {
                throw ValidationException::withMessages([
                    'code' => [__('diyar.otp.invalid')],
                ]);
            }

            $user->forceFill([
                'status' => UserStatus::Active,
                'phone_verified_at' => now(),
            ])->save();

            $roles = $this->resolveRoles($roleKeys);

            foreach ($roles as $role) {
                $this->assignRoleIfMissing($user, $role);
            }

            return $user->fresh('roles');
        });

        return $this->auth->establishSession($user);
    }

    private function assignRoleIfMissing(User $user, Role $role): void
    {
        if ($user->roles()->where('roles.id', $role->id)->exists()) {
            return;
        }

        $user->roles()->attach($role->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);

        if ($role->name === RoleName::Vendor) {
            VendorAccount::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['business_name' => $user->name],
            );
        }

        if ($role->name === RoleName::Provider) {
            ProviderAccount::query()->firstOrCreate(
                ['user_id' => $user->id],
                ['business_name' => $user->name],
            );
        }
    }

    /**
     * @param  list<string>  $roleKeys
     * @return list<string>
     */
    private function validateRoleKeys(array $roleKeys): array
    {
        if ($roleKeys === []) {
            throw ValidationException::withMessages([
                'roles' => [__('diyar.registration.roles_required')],
            ]);
        }

        $resolved = [];
        foreach ($roleKeys as $key) {
            $enum = RoleName::fromRegistrationKey($key);
            if ($enum === null || $enum === RoleName::Admin) {
                throw ValidationException::withMessages([
                    'roles' => [__('diyar.registration.invalid_roles')],
                ]);
            }
            $resolved[$enum->value] = $enum->value;
        }

        $resolved[RoleName::Customer->value] = RoleName::Customer->value;

        return array_values($resolved);
    }

    /**
     * @param  list<string>  $roleKeys
     * @return list<Role>
     */
    private function resolveRoles(array $roleKeys): array
    {
        $validated = $this->validateRoleKeys($roleKeys);

        $roles = Role::query()
            ->whereIn('name', $validated)
            ->get();

        if ($roles->count() !== count($validated)) {
            throw ValidationException::withMessages([
                'roles' => [__('diyar.registration.invalid_roles')],
            ]);
        }

        return $roles->all();
    }
}
