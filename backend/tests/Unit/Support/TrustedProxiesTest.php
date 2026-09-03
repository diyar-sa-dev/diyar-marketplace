<?php

declare(strict_types=1);

namespace Tests\Unit\Support;

use App\Support\Http\TrustedProxies;
use Tests\TestCase;

class TrustedProxiesTest extends TestCase
{
    public function test_default_includes_private_docker_ranges(): void
    {
        putenv('TRUSTED_PROXIES');

        $addresses = TrustedProxies::addresses();

        $this->assertContains('127.0.0.1', $addresses);
        $this->assertContains('172.16.0.0/12', $addresses);
    }

    public function test_env_override_is_respected(): void
    {
        putenv('TRUSTED_PROXIES=10.0.0.5,192.168.1.0/24');

        $addresses = TrustedProxies::addresses();

        $this->assertSame(['10.0.0.5', '192.168.1.0/24'], $addresses);

        putenv('TRUSTED_PROXIES');
    }
}
