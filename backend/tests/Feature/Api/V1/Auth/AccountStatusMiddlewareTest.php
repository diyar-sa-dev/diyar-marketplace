<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Enums\UserStatus;
use App\Http\Middleware\EnsureAccountIsActive;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

class AccountStatusMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_pending_user_can_access_me_and_logout(): void
    {
        $user = User::factory()->pending()->create([
            'phone' => '966507777777',
        ]);

        $this->actingAs($user, 'web')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.status', UserStatus::Pending->value);

        $this->actingAs($user, 'web')
            ->postJson('/api/v1/auth/logout')
            ->assertOk();
    }

    public function test_pending_user_is_blocked_from_protected_resources(): void
    {
        $user = User::factory()->pending()->create([
            'phone' => '966508888888',
        ]);

        $response = app(EnsureAccountIsActive::class)->handle(
            Request::create('/api/v1/example/protected', 'GET')->setUserResolver(fn () => $user),
            fn () => response()->json(['ok' => true]),
        );

        $this->assertSame(403, $response->getStatusCode());
        $payload = $response->getData(true);
        $this->assertSame('pending', $payload['errors']['account_status'][0] ?? null);
    }

    public function test_suspended_user_is_blocked_from_protected_resources(): void
    {
        $user = User::factory()->create([
            'phone' => '966509999999',
            'status' => UserStatus::Suspended,
        ]);

        $response = app(EnsureAccountIsActive::class)->handle(
            Request::create('/api/v1/example/protected', 'GET')->setUserResolver(fn () => $user),
            fn () => response()->json(['ok' => true]),
        );

        $this->assertSame(403, $response->getStatusCode());
        $payload = $response->getData(true);
        $this->assertSame('suspended', $payload['errors']['account_status'][0] ?? null);
    }
}
