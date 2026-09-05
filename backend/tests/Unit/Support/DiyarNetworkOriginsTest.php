<?php

namespace Tests\Unit\Support;

use App\Support\Http\DiyarNetworkOrigins;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DiyarNetworkOriginsTest extends TestCase
{
    protected function tearDown(): void
    {
        config([
            'sanctum.stateful' => DiyarNetworkOrigins::statefulDomains(),
        ]);

        parent::tearDown();
    }

    #[Test]
    public function it_expands_lan_host_into_sanctum_and_cors_lists(): void
    {
        putenv('DIYAR_LAN_HOST=192.168.1.50');
        putenv('FRONTEND_PORT=3000');
        putenv('HTTP_PORT=8093');
        putenv('SANCTUM_STATEFUL_DOMAINS_BASE=localhost,localhost:3000');
        putenv('CORS_ALLOWED_ORIGINS_BASE=http://localhost:3000');
        putenv('SANCTUM_STATEFUL_DOMAINS=');
        putenv('CORS_ALLOWED_ORIGINS=');

        $domains = DiyarNetworkOrigins::statefulDomains();

        $this->assertContains('localhost', $domains);
        $this->assertContains('192.168.1.50', $domains);
        $this->assertContains('192.168.1.50:3000', $domains);
        $this->assertContains('192.168.1.50:8093', $domains);

        $origins = DiyarNetworkOrigins::corsOrigins();

        $this->assertContains('http://192.168.1.50:3000', $origins);
    }

    #[Test]
    public function auto_lan_host_does_not_add_variants(): void
    {
        putenv('DIYAR_LAN_HOST=auto');

        $domains = DiyarNetworkOrigins::statefulDomains();

        $this->assertNotContains('auto', $domains);
        $this->assertNotContains('auto:3000', $domains);
    }
}
