<?php

namespace App\Services\Security;

final class UserAgentParser
{
    /**
     * @return array{
     *     device_type: string|null,
     *     browser: string|null,
     *     browser_version: string|null,
     *     platform: string|null,
     *     platform_version: string|null,
     *     device_name: string|null
     * }
     */
    public function parse(?string $userAgent): array
    {
        $userAgent = trim((string) $userAgent);

        if ($userAgent === '') {
            return $this->emptyResult();
        }

        $deviceType = $this->detectDeviceType($userAgent);
        [$browser, $browserVersion] = $this->detectBrowser($userAgent);
        [$platform, $platformVersion] = $this->detectPlatform($userAgent);
        $deviceName = $this->detectDeviceName($userAgent, $platform, $deviceType);

        return [
            'device_type' => $deviceType,
            'browser' => $browser,
            'browser_version' => $browserVersion,
            'platform' => $platform,
            'platform_version' => $platformVersion,
            'device_name' => $deviceName,
        ];
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function detectBrowser(string $userAgent): array
    {
        $patterns = [
            'Edge' => '/Edg(?:e|A|IOS)?\/([\d.]+)/i',
            'Opera' => '/OPR\/([\d.]+)/i',
            'Chrome' => '/Chrome\/([\d.]+)/i',
            'Firefox' => '/Firefox\/([\d.]+)/i',
            'Safari' => '/Version\/([\d.]+).*Safari/i',
        ];

        foreach ($patterns as $name => $pattern) {
            if (preg_match($pattern, $userAgent, $matches) === 1) {
                if ($name === 'Chrome' && str_contains($userAgent, 'Edg')) {
                    continue;
                }

                return [$name, $this->majorVersion($matches[1])];
            }
        }

        return [null, null];
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function detectPlatform(string $userAgent): array
    {
        $patterns = [
            'Windows' => '/Windows NT ([\d.]+)/i',
            'macOS' => '/Mac OS X ([\d_]+)/i',
            'Android' => '/Android ([\d.]+)/i',
            'iOS' => '/(?:iPhone|iPad|iPod).*OS ([\d_]+)/i',
            'Linux' => '/Linux/i',
        ];

        foreach ($patterns as $name => $pattern) {
            if (preg_match($pattern, $userAgent, $matches) === 1) {
                $version = isset($matches[1])
                    ? str_replace('_', '.', $this->majorVersion($matches[1]))
                    : null;

                return [$name, $version];
            }
        }

        return [null, null];
    }

    private function detectDeviceType(string $userAgent): ?string
    {
        if (preg_match('/iPad|Tablet|Kindle|Silk/i', $userAgent) === 1) {
            return 'tablet';
        }

        if (preg_match('/Mobile|iPhone|Android.*Mobile|Windows Phone/i', $userAgent) === 1) {
            return 'mobile';
        }

        return 'desktop';
    }

    private function detectDeviceName(string $userAgent, ?string $platform, ?string $deviceType): ?string
    {
        if ($platform === 'iOS' && preg_match('/iPhone/i', $userAgent) === 1) {
            return 'iPhone';
        }

        if ($platform === 'iOS' && preg_match('/iPad/i', $userAgent) === 1) {
            return 'iPad';
        }

        if ($platform === 'Android' && preg_match('/;\s*([^;)]+)\s+Build\//i', $userAgent, $matches) === 1) {
            return trim($matches[1]);
        }

        return match ($deviceType) {
            'mobile' => 'Mobile device',
            'tablet' => 'Tablet',
            'desktop' => $platform !== null ? $platform.' computer' : 'Computer',
            default => null,
        };
    }

    private function majorVersion(string $version): ?string
    {
        $parts = explode('.', str_replace('_', '.', $version));

        return $parts[0] !== '' ? $parts[0] : null;
    }

    /**
     * @return array{
     *     device_type: null,
     *     browser: null,
     *     browser_version: null,
     *     platform: null,
     *     platform_version: null,
     *     device_name: null
     * }
     */
    private function emptyResult(): array
    {
        return [
            'device_type' => null,
            'browser' => null,
            'browser_version' => null,
            'platform' => null,
            'platform_version' => null,
            'device_name' => null,
        ];
    }
}
