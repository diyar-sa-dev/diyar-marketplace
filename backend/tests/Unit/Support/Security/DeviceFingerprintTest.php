<?php

namespace Tests\Unit\Support\Security;

use App\Models\UserSession;
use App\Support\Security\DeviceFingerprint;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DeviceFingerprintTest extends TestCase
{
    #[Test]
    public function identical_device_attributes_produce_same_fingerprint(): void
    {
        $base = [
            'device_type' => 'desktop',
            'browser' => 'Chrome',
            'browser_version' => '152',
            'platform' => 'Windows',
            'platform_version' => '10',
            'device_name' => 'Windows computer',
            'ip_address' => '192.168.1.10',
        ];

        $sessionA = new UserSession($base);
        $sessionB = new UserSession($base);

        $this->assertSame(
            DeviceFingerprint::forSession($sessionA),
            DeviceFingerprint::forSession($sessionB),
        );
    }

    #[Test]
    public function different_ip_produces_different_fingerprint(): void
    {
        $sessionA = new UserSession([
            'device_type' => 'desktop',
            'browser' => 'Chrome',
            'browser_version' => '152',
            'platform' => 'Windows',
            'platform_version' => '10',
            'device_name' => 'Windows computer',
            'ip_address' => '192.168.1.10',
        ]);

        $sessionB = new UserSession([
            ...$sessionA->getAttributes(),
            'ip_address' => '192.168.1.11',
        ]);

        $this->assertNotSame(
            DeviceFingerprint::forSession($sessionA),
            DeviceFingerprint::forSession($sessionB),
        );
    }
}
