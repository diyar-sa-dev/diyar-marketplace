<?php

namespace Tests\Unit\Services\Security;

use App\Services\Security\IpGeolocationService;
use Illuminate\Http\Request;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class IpGeolocationServiceTest extends TestCase
{
    #[Test]
    public function registration_lookup_never_uses_untrusted_client_geo_headers(): void
    {
        config(['diyar.security.trust_geo_proxy_headers' => false]);

        $service = new IpGeolocationService;
        $request = Request::create('/', 'GET');
        $request->headers->set('CF-IPCountry', 'US');

        $result = $service->resolveForRegistration($request);

        $this->assertNull($result['country']);
        $this->assertSame('unknown', $result['location_source']);
    }

    #[Test]
    public function registration_lookup_uses_trusted_proxy_headers_when_enabled(): void
    {
        config(['diyar.security.trust_geo_proxy_headers' => true]);

        $service = new IpGeolocationService;
        $request = Request::create('/', 'GET');
        $request->headers->set('CF-IPCountry', 'SA');
        $request->headers->set('CF-IPCity', 'Jeddah');

        $result = $service->resolveForRegistration($request);

        $this->assertSame('SA', $result['country']);
        $this->assertSame('Jeddah', $result['city']);
        $this->assertSame('proxy_header', $result['location_source']);
    }
}
