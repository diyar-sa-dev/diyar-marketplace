<?php

namespace Tests\Feature\Http;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HttpCachePolicyTest extends TestCase
{
    use RefreshDatabase;

    public function test_anonymous_public_catalog_get_is_publicly_cacheable(): void
    {
        $response = $this->getJson('/api/v1/categories');

        $response->assertOk();
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('public', $cacheControl);
        $this->assertStringContainsString('max-age=', $cacheControl);
        $this->assertStringContainsString('Accept-Language', (string) $response->headers->get('Vary'));
    }

    public function test_anonymous_platform_theme_is_publicly_cacheable(): void
    {
        $response = $this->getJson('/api/v1/platform/theme');

        $response->assertOk();
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('public', $cacheControl);
        $this->assertStringContainsString('max-age=300', $cacheControl);
    }

    public function test_authenticated_catalog_request_is_private_no_store(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/categories');

        $response->assertOk();
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('private', $cacheControl);
    }

    public function test_session_cookie_makes_catalog_private_even_without_auth_user(): void
    {
        $sessionCookie = (string) config('session.cookie');

        $response = $this->withHeader('Cookie', "{$sessionCookie}=guest-session-token")
            ->getJson('/api/v1/products');

        $response->assertOk();
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
    }

    public function test_authorization_header_makes_catalog_private(): void
    {
        $response = $this->withHeader('Authorization', 'Bearer test-token')
            ->getJson('/api/v1/categories');

        $response->assertOk();
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringContainsString('Authorization', (string) $response->headers->get('Vary'));
    }

    public function test_private_read_prefix_is_no_store_for_anonymous_requests(): void
    {
        $response = $this->getJson('/api/v1/notifications');

        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
        $this->assertStringNotContainsString('public', $cacheControl);
    }

    public function test_auth_me_is_private_no_store(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/api/v1/auth/me');

        $response->assertOk();
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
    }

    public function test_admin_api_is_private_no_store(): void
    {
        $response = $this->getJson('/api/v1/admin/dashboard');

        $this->assertContains($response->status(), [401, 403]);
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
    }

    public function test_mutating_requests_are_private_no_store(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '+966500000001',
            'password' => 'wrong-password',
        ]);

        $this->assertContains($response->status(), [401, 422, 429]);
        $cacheControl = (string) $response->headers->get('Cache-Control');
        $this->assertStringContainsString('no-store', $cacheControl);
    }
}
