<?php

namespace Tests\Feature\Api\V1\Locale;

use App\Listeners\Octane\ResetRequestScopedState;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Laravel\Octane\Events\RequestReceived;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class LocaleIsolationTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function octane_reset_restores_default_locale_between_requests(): void
    {
        app()->setLocale('en');

        $event = new RequestReceived($this->app, $this->app, Request::create('/api/v1/health', 'GET'));
        app(ResetRequestScopedState::class)->handle($event);

        $this->assertSame((string) config('app.locale', 'ar'), app()->getLocale());
    }

    #[Test]
    public function api_requests_resolve_locale_from_headers_independently(): void
    {
        $this->getJson('/api/v1/health', ['X-Locale' => 'en', 'Accept' => 'application/json'])
            ->assertOk();

        $this->assertSame('en', app()->getLocale());

        app(ResetRequestScopedState::class)->handle(
            new RequestReceived($this->app, $this->app, Request::create('/api/v1/health', 'GET')),
        );

        $this->getJson('/api/v1/health', ['X-Locale' => 'ar', 'Accept' => 'application/json'])
            ->assertOk();

        $this->assertSame('ar', app()->getLocale());
    }
}
