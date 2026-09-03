<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Enums\RoleName;
use App\Listeners\Octane\FlushAuthAndSessionState;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Octane\Events\RequestReceived;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AuthSessionIsolationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function independent_session_cookies_do_not_share_authentication(): void
    {
        $userA = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966501111111',
            'password' => 'Password123!',
        ]);
        $userB = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966502222222',
            'password' => 'Password123!',
        ]);

        $loginA = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '501111111',
            'password' => 'Password123!',
        ]);
        $loginA->assertOk()->assertJsonPath('data.user.id', $userA->id);

        $sessionCookieName = config('session.cookie');
        $sessionIdA = $this->extractCookieValue($loginA, $sessionCookieName);
        $this->assertNotNull($sessionIdA);

        $this->resetStatefulSession();

        $loginB = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '502222222',
            'password' => 'Password123!',
        ]);
        $loginB->assertOk()->assertJsonPath('data.user.id', $userB->id);

        $sessionIdB = $this->extractCookieValue($loginB, $sessionCookieName);
        $this->assertNotNull($sessionIdB);
        $this->assertNotSame($sessionIdA, $sessionIdB);

        Auth::forgetGuards();
        $this->resetStatefulSession();
        $this->withUnencryptedCookie($sessionCookieName, $sessionIdA)
            ->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $userA->id);

        Auth::forgetGuards();
        $this->resetStatefulSession();
        $this->withUnencryptedCookie($sessionCookieName, $sessionIdB)
            ->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.user.id', $userB->id);
    }

    #[Test]
    public function logout_with_remember_me_cannot_be_restored_by_stale_remember_cookie(): void
    {
        $user = $this->createUserWithRole(RoleName::Customer, [
            'phone' => '966503333333',
            'password' => 'Password123!',
        ]);

        $login = $this->postStatefulJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '503333333',
            'password' => 'Password123!',
            'remember' => true,
        ]);
        $login->assertOk();

        $rememberCookie = $this->extractRememberCookie($login);
        $this->assertNotNull($rememberCookie);

        $this->postStatefulJson('/api/v1/auth/logout')->assertOk();
        $this->getStatefulJson('/api/v1/auth/me')->assertUnauthorized();

        $this->resetStatefulSession();
        $this->get('/sanctum/csrf-cookie');

        $this->withUnencryptedCookie($rememberCookie['name'], $rememberCookie['value'])
            ->withHeaders($this->statefulHeaders())
            ->getJson('/api/v1/auth/me')
            ->assertUnauthorized();

        $user->refresh();
        $this->assertNull($user->remember_token);
    }

    #[Test]
    public function octane_auth_flush_clears_in_memory_guard_state(): void
    {
        $user = User::factory()->create();

        Auth::guard('web')->login($user);
        $this->assertTrue(Auth::guard('web')->check());

        $request = Request::create('/api/v1/auth/me', 'GET');
        $event = new RequestReceived($this->app, $this->app, $request);

        app(FlushAuthAndSessionState::class)->handle($event);

        $this->assertFalse(Auth::guard('web')->check());
        $this->assertNull($request->user());
    }

    #[Test]
    public function octane_auth_flush_clears_request_session_clone(): void
    {
        $request = Request::create('/api/v1/auth/me', 'GET');
        $request->setLaravelSession(app('session.store'));

        $event = new RequestReceived($this->app, $this->app, $request);

        app(FlushAuthAndSessionState::class)->handle($event);

        $this->assertFalse($request->hasSession());
    }

    /**
     * @return array{name: string, value: string}|null
     */
    private function extractRememberCookie(\Illuminate\Testing\TestResponse $response): ?array
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if (str_starts_with($cookie->getName(), 'remember_web_')) {
                return [
                    'name' => $cookie->getName(),
                    'value' => $cookie->getValue(),
                ];
            }
        }

        return null;
    }

    private function extractCookieValue(\Illuminate\Testing\TestResponse $response, string $name): ?string
    {
        foreach ($response->headers->getCookies() as $cookie) {
            if ($cookie->getName() === $name) {
                return $cookie->getValue();
            }
        }

        return null;
    }
}
