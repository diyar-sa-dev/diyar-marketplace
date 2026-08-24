<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\ValidateCsrfToken;
use App\Http\Middleware\NormalizeSessionCookieDomain;
use Illuminate\Http\Request;
use Tests\TestCase;

class NormalizeSessionCookieDomainTest extends TestCase
{
    public function test_clears_session_domain_when_it_does_not_match_request_host(): void
    {
        config(['session.domain' => 'diyar-psi.vercel.app']);

        $request = Request::create('https://diyar-k255.onrender.com/api/v1/health', 'GET', server: [
            'HTTP_HOST' => 'diyar-k255.onrender.com',
        ]);

        $middleware = new NormalizeSessionCookieDomain();
        $middleware->handle($request, fn () => response('ok'));

        $this->assertNull(config('session.domain'));
    }

    public function test_keeps_compatible_session_domain(): void
    {
        config(['session.domain' => 'diyar-psi.vercel.app']);

        $request = Request::create('https://diyar-psi.vercel.app/api/v1/health', 'GET', server: [
            'HTTP_HOST' => 'diyar-psi.vercel.app',
        ]);

        $middleware = new NormalizeSessionCookieDomain();
        $middleware->handle($request, fn () => response('ok'));

        $this->assertSame('diyar-psi.vercel.app', config('session.domain'));
    }

    public function test_compatible_session_domain_helper(): void
    {
        $this->assertNull(
            ValidateCsrfToken::compatibleSessionDomain('diyar-k255.onrender.com', 'diyar-psi.vercel.app'),
        );
        $this->assertSame(
            'diyar-psi.vercel.app',
            ValidateCsrfToken::compatibleSessionDomain('diyar-psi.vercel.app', 'diyar-psi.vercel.app'),
        );
    }
}
