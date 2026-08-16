<?php

namespace Tests\Concerns;

use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Enums\OtpPurpose;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\ProviderAccount;
use App\Services\Identity\OtpCacheStore;
use Database\Seeders\RoleSeeder;

trait InteractsWithIdentity
{
    protected function seedRoles(): void
    {
        $this->seed(RoleSeeder::class);
    }

    protected function extractOtpFromLastSms(): string
    {
        $developmentOtp = LogSmsProvider::lastDevelopmentOtp();
        if ($developmentOtp !== null) {
            return $developmentOtp['otp'];
        }

        $message = LogSmsProvider::lastMessage();
        $this->assertNotNull($message);

        preg_match('/\b(\d{6})\b/', (string) $message, $matches);
        $this->assertNotEmpty($matches[1] ?? null);

        return $matches[1];
    }

    protected function createUserWithRole(RoleName $role, array $overrides = []): User
    {
        $this->seedRoles();

        $roleModel = Role::query()->where('name', $role->value)->firstOrFail();

        $user = User::factory()->create($overrides);

        $user->roles()->attach($roleModel->id, [
            'id' => (string) str()->uuid(),
            'status' => RoleStatus::Active->value,
        ]);

        if ($role === RoleName::Vendor) {
            VendorAccount::query()->create([
                'user_id' => $user->id,
                'business_name' => $user->name,
            ]);
        }

        if ($role === RoleName::Provider) {
            ProviderAccount::query()->create([
                'user_id' => $user->id,
                'business_name' => $user->name,
            ]);
        }

        return $user->fresh('roles');
    }

    protected function registrationPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Test User',
            'phone' => '501234567',
            'email' => 'test@example.com',
            'password' => 'Password123!',
            'roles' => ['customer'],
        ], $overrides);
    }

    protected function statefulHeaders(): array
    {
        return [
            'Origin' => 'http://localhost:3000',
            'Referer' => 'http://localhost:3000',
            'Sec-Fetch-Site' => 'same-origin',
        ];
    }

    protected function postStatefulJson(string $uri, array $data = [])
    {
        $this->withHeaders($this->statefulHeaders())->get('/sanctum/csrf-cookie');

        return $this->withHeaders(array_merge($this->statefulHeaders(), [
            'X-XSRF-TOKEN' => csrf_token(),
        ]))->postJson($uri, $data);
    }

    protected function getStatefulJson(string $uri)
    {
        return $this->withHeaders($this->statefulHeaders())->getJson($uri);
    }

    protected function otpCacheState(string $phone, OtpPurpose $purpose): ?array
    {
        return app(OtpCacheStore::class)->get($phone, $purpose);
    }
}
