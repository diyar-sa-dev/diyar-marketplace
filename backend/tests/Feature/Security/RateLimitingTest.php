<?php

namespace Tests\Feature\Security;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['diyar.loadtest.enabled' => false]);

        RateLimiter::clear('auth');
        RateLimiter::clear('otp');
        RateLimiter::clear('catalog-search');
        RateLimiter::clear('assistant-chat');
    }

    public function test_auth_login_is_rate_limited(): void
    {
        config(['diyar.rate_limits.auth_per_minute' => 3]);

        $payload = [
            'method' => 'phone',
            'identifier' => '+966500000001',
            'password' => 'wrong-password',
        ];

        for ($i = 0; $i < 3; $i++) {
            $this->postJson('/api/v1/auth/login', $payload)->assertStatus(422);
        }

        $this->postJson('/api/v1/auth/login', $payload)->assertStatus(429);
    }

    public function test_catalog_search_is_rate_limited(): void
    {
        config(['diyar.rate_limits.catalog_search_per_minute' => 3]);

        for ($i = 0; $i < 3; $i++) {
            $this->getJson('/api/v1/catalog/search?q=test&type=products')
                ->assertOk();
        }

        $this->getJson('/api/v1/catalog/search?q=test&type=products')
            ->assertStatus(429);
    }

    public function test_otp_resend_is_rate_limited(): void
    {
        config(['diyar.rate_limits.otp_per_minute' => 2]);

        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/v1/auth/forgot-password', [
                'phone' => '+966500000099',
            ]);
        }

        $this->postJson('/api/v1/auth/forgot-password', [
            'phone' => '+966500000099',
        ])->assertStatus(429);
    }

    public function test_assistant_chat_is_rate_limited(): void
    {
        config([
            'diyar.rate_limits.assistant_chat_per_minute' => 2,
            'diyar.assistant.enabled' => false,
        ]);

        $payload = [
            'messages' => [
                ['role' => 'user', 'content' => 'Hello'],
            ],
        ];

        for ($i = 0; $i < 2; $i++) {
            $this->postJson('/api/v1/assistant/chat', $payload)->assertStatus(503);
        }

        $this->postJson('/api/v1/assistant/chat', $payload)->assertStatus(429);
    }
}
