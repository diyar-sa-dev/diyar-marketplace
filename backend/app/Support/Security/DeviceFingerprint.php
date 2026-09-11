<?php

namespace App\Support\Security;

use App\Models\UserSession;

final class DeviceFingerprint
{
    public static function forSession(UserSession $session): string
    {
        $parts = [
            self::normalize((string) $session->device_type),
            self::normalize((string) $session->browser),
            self::normalize((string) $session->browser_version),
            self::normalize((string) $session->platform),
            self::normalize((string) $session->platform_version),
            self::normalize((string) $session->device_name),
            self::normalizeIp((string) $session->ip_address),
        ];

        return hash('sha256', implode('|', $parts));
    }

    private static function normalize(string $value): string
    {
        return strtolower(trim($value));
    }

    private static function normalizeIp(string $ip): string
    {
        return trim($ip);
    }
}
