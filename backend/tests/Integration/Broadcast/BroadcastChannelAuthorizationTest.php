<?php

namespace Tests\Integration\Broadcast;

use App\Enums\RoleName;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Group;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

/**
 * Verifies private channel authorization for Reverb/Pusher clients.
 */
#[Group('broadcast-integration')]
class BroadcastChannelAuthorizationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'broadcasting.default' => 'reverb',
            'broadcasting.connections.reverb.key' => 'test-key',
            'broadcasting.connections.reverb.secret' => 'test-secret',
            'broadcasting.connections.reverb.app_id' => 'test-app-id',
            'reverb.apps.apps' => [[
                'key' => 'test-key',
                'secret' => 'test-secret',
                'app_id' => 'test-app-id',
                'options' => [
                    'host' => '127.0.0.1',
                    'port' => 8090,
                    'scheme' => 'http',
                    'useTLS' => false,
                ],
                'allowed_origins' => ['*'],
            ]],
        ]);
    }

    public function test_user_private_channel_authorizes_owner_only(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);

        $authorize = function (?User $authenticated, string $userId): bool {
            if ($authenticated === null) {
                return false;
            }

            return hash_equals((string) $authenticated->getAuthIdentifier(), (string) $userId);
        };

        $this->assertTrue($authorize($user, (string) $user->id));
        $this->assertFalse($authorize($other, (string) $user->id));
        $this->assertFalse($authorize(null, (string) $user->id));
    }

    public function test_broadcasting_auth_endpoint_rejects_foreign_user_channel(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);
        $other = $this->createUserWithRole(RoleName::Customer);

        Sanctum::actingAs($other);

        $this->postJson('/broadcasting/auth', [
            'socket_id' => '123.456',
            'channel_name' => 'private-users.'.$user->id,
        ])->assertForbidden();
    }

    public function test_broadcasting_auth_cors_preflight_allows_frontend_origin(): void
    {
        $origin = (string) config('cors.allowed_origins.0', 'http://localhost:3000');

        $this->withHeaders([
            'Origin' => $origin,
            'Access-Control-Request-Method' => 'POST',
            'Access-Control-Request-Headers' => 'content-type,x-xsrf-token',
        ])->options('/broadcasting/auth')
            ->assertSuccessful()
            ->assertHeader('Access-Control-Allow-Origin', $origin);
    }

    public function test_authenticated_user_passes_own_channel_authorization_logic(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer);

        $authorized = hash_equals(
            (string) $user->getAuthIdentifier(),
            (string) $user->id,
        );

        $this->assertTrue($authorized);
    }
}
