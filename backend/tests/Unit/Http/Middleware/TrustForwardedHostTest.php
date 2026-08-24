<?php

namespace Tests\Unit\Http\Middleware;

use App\Http\Middleware\TrustForwardedHost;
use Tests\TestCase;

class TrustForwardedHostTest extends TestCase
{
    public function test_forwarded_host_is_applied_to_request(): void
    {
        $request = \Illuminate\Http\Request::create(
            'https://diyar-k255.onrender.com/api/v1/health',
            'GET',
            server: ['HTTP_HOST' => 'diyar-k255.onrender.com'],
        );
        $request->headers->set('X-Forwarded-Host', 'diyar-psi.vercel.app');
        $request->headers->set('X-Forwarded-Proto', 'https');

        $middleware = new TrustForwardedHost();
        $middleware->handle($request, fn ($passed) => response('ok'));

        $this->assertSame('diyar-psi.vercel.app', $request->getHost());
        $this->assertSame('diyar-psi.vercel.app', $request->server->get('HTTP_HOST'));
    }
}
