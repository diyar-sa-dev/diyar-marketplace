<?php

namespace Tests\Concerns;

use App\Enums\OtpPurpose;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\VendorAccountStatus;
use App\Infrastructure\Mail\LogEmailOtpProvider;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Models\ProviderAccount;
use App\Models\Role;
use App\Models\User;
use App\Models\VendorAccount;
use App\Services\Identity\OtpCacheStore;
use App\Support\SlugGenerator;
use Database\Seeders\RoleSeeder;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\Sanctum;

trait InteractsWithIdentity
{
    private bool $statefulSessionBootstrapped = false;

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
                'slug' => SlugGenerator::unique($user->name, new VendorAccount),
                'status' => VendorAccountStatus::Active,
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

    protected function beginStatefulSession(): void
    {
        $this->withCredentials();
        $this->withHeaders($this->statefulHeaders());

        if ($this->statefulSessionBootstrapped) {
            return;
        }

        $this->persistResponseCookies($this->get('/sanctum/csrf-cookie'));
        $this->statefulSessionBootstrapped = true;
    }

    protected function persistResponseCookies(TestResponse $response): void
    {
        foreach ($response->headers->getCookies() as $cookie) {
            $this->withUnencryptedCookie($cookie->getName(), $cookie->getValue());
        }
    }

    protected function statefulJsonHeaders(): array
    {
        return array_merge($this->statefulHeaders(), [
            'X-XSRF-TOKEN' => csrf_token(),
        ]);
    }

    protected function postStatefulJson(string $uri, array $data = [])
    {
        $this->beginStatefulSession();

        $response = $this->withHeaders($this->statefulJsonHeaders())->postJson($uri, $data);
        $this->persistResponseCookies($response);

        return $response;
    }

    protected function getStatefulJson(string $uri)
    {
        $this->beginStatefulSession();

        $response = $this->withHeaders(['Accept' => 'application/json'])->get($uri);
        $this->persistResponseCookies($response);

        return $response;
    }

    protected function patchStatefulJson(string $uri, array $data = [])
    {
        $this->beginStatefulSession();

        $response = $this->withHeaders($this->statefulJsonHeaders())->patchJson($uri, $data);
        $this->persistResponseCookies($response);

        return $response;
    }

    protected function deleteStatefulJson(string $uri, array $data = [])
    {
        $this->beginStatefulSession();

        $response = $this->withHeaders($this->statefulJsonHeaders())->deleteJson($uri, $data);
        $this->persistResponseCookies($response);

        return $response;
    }

    protected function resetStatefulSession(): void
    {
        $this->statefulSessionBootstrapped = false;

        if (method_exists($this, 'flushSession')) {
            $this->flushSession();
        }
    }

    protected function getJsonAsUser(string $uri, User $user)
    {
        Sanctum::actingAs($user);

        return $this->getJson($uri);
    }

    protected function postJsonAsUser(string $uri, User $user, array $data = [], array $headers = [])
    {
        Sanctum::actingAs($user);

        return $this->withHeaders($headers)->postJson($uri, $data);
    }

    protected function patchJsonAsUser(string $uri, User $user, array $data = [], array $headers = [])
    {
        Sanctum::actingAs($user);

        return $this->withHeaders($headers)->patchJson($uri, $data);
    }

    protected function deleteJsonAsUser(string $uri, User $user, array $data = [], array $headers = [])
    {
        Sanctum::actingAs($user);

        return $this->withHeaders($headers)->deleteJson($uri, $data);
    }

    protected function postStatefulJsonAsUser(string $uri, User $user, array $data = [])
    {
        $this->beginStatefulSession();

        $response = $this->actingAs($user)
            ->withHeaders($this->statefulJsonHeaders())
            ->postJson($uri, $data);
        $this->persistResponseCookies($response);

        return $response;
    }

    protected function otpCacheState(string $phone, OtpPurpose $purpose): ?array
    {
        return app(OtpCacheStore::class)->get($phone, $purpose);
    }

    protected function extractEmailOtpFromLog(): string
    {
        $developmentOtp = LogEmailOtpProvider::lastDevelopmentOtp();
        $this->assertNotNull($developmentOtp);

        return $developmentOtp['otp'];
    }
}
