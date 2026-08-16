<?php

namespace Tests\Feature\Api\V1;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocaleMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    public function test_accept_language_header_returns_localized_validation_messages(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '',
            'password' => '',
        ], [
            'Accept-Language' => 'en',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'The credentials field is required.');
    }

    public function test_x_locale_header_returns_arabic_validation_messages(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => '',
            'password' => '',
        ], [
            'X-Locale' => 'ar',
        ]);

        $response
            ->assertUnprocessable()
            ->assertJsonPath('errors.identifier.0', 'حقل بيانات الدخول مطلوب.');
    }
}
