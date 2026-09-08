<?php

declare(strict_types=1);

/**
 * Multinode session revocation gate — uses PHP curl (Netscape cookie jar) for reliable CSRF/session handling.
 *
 * Start stack: docker compose -f docker-compose.multinode.yml up -d
 * Run: php scripts/certification-session-multinode-probe.php
 */
final class MultinodeCurlSession
{
    private readonly string $cookieJar;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $origin = 'http://127.0.0.1:3000',
    ) {
        $jar = tempnam(sys_get_temp_dir(), 'diyar_mn_jar_');
        if ($jar === false) {
            throw new RuntimeException('Unable to create cookie jar.');
        }

        $this->cookieJar = $jar;
    }

    public function __destruct()
    {
        if (is_file($this->cookieJar)) {
            @unlink($this->cookieJar);
        }
    }

    public function healthStatus(): int
    {
        return $this->request('GET', '/api/v1/health')['status'];
    }

    public function login(string $phone, string $password): int
    {
        $this->request('GET', '/sanctum/csrf-cookie');

        $xsrf = $this->readXsrfToken();
        $headers = ['X-XSRF-TOKEN: '.$xsrf];

        return $this->request('POST', '/api/v1/auth/login', [
            'method' => 'phone',
            'identifier' => $phone,
            'password' => $password,
        ], $headers)['status'];
    }

    public function me(): int
    {
        return $this->request('GET', '/api/v1/auth/me', null, $this->xsrfHeader())['status'];
    }

    public function logoutOthers(): int
    {
        return $this->request('POST', '/api/v1/profile/security/sessions/logout-others', null, $this->xsrfHeader())['status'];
    }

    /** @param array<string, mixed>|null $json */
    private function request(string $method, string $path, ?array $json = null, array $extraHeaders = []): array
    {
        $ch = curl_init($this->baseUrl.$path);
        if ($ch === false) {
            throw new RuntimeException('curl_init failed.');
        }

        $headers = array_merge([
            'Accept: application/json',
            'Origin: '.$this->origin,
            'Referer: '.$this->origin.'/',
            'X-Requested-With: XMLHttpRequest',
        ], $extraHeaders);

        if ($json !== null) {
            $headers[] = 'Content-Type: application/json';
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($json, JSON_THROW_ON_ERROR));
        }

        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HEADER => false,
            CURLOPT_COOKIEJAR => $this->cookieJar,
            CURLOPT_COOKIEFILE => $this->cookieJar,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30,
        ]);

        $body = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return ['status' => $status, 'body' => is_string($body) ? $body : ''];
    }

    private function readXsrfToken(): string
    {
        $lines = file($this->cookieJar, FILE_IGNORE_NEW_LINES) ?: [];

        foreach ($lines as $line) {
            if (str_starts_with($line, '#') || trim($line) === '') {
                continue;
            }

            $parts = preg_split('/\s+/', trim($line));
            if (! is_array($parts) || count($parts) < 7) {
                continue;
            }

            if ($parts[5] === 'XSRF-TOKEN') {
                return urldecode((string) $parts[6]);
            }
        }

        throw new RuntimeException('XSRF-TOKEN cookie missing after CSRF bootstrap.');
    }

    /** @return list<string> */
    private function xsrfHeader(): array
    {
        return ['X-XSRF-TOKEN: '.$this->readXsrfToken()];
    }
}

$baseUrl = rtrim((string) (getenv('MULTINODE_BASE_URL') ?: 'http://127.0.0.1:8088'), '/');
$phone = (string) (getenv('MULTINODE_TEST_PHONE') ?: '500000010');
$password = (string) (getenv('MULTINODE_TEST_PASSWORD') ?: 'Password123!');

echo "Multinode session gate → {$baseUrl}/api/v1\n";

$probe = new MultinodeCurlSession($baseUrl);

if ($probe->healthStatus() !== 200) {
    fwrite(STDERR, "Health check failed. Start: docker compose -f docker-compose.multinode.yml up -d\n");
    exit(2);
}

$sessionA = new MultinodeCurlSession($baseUrl);
$sessionB = new MultinodeCurlSession($baseUrl);

$loginA = $sessionA->login($phone, $password);
if ($loginA !== 200) {
    fwrite(STDERR, "Node login A failed with HTTP {$loginA}\n");
    exit(1);
}

$loginB = $sessionB->login($phone, $password);
if ($loginB !== 200) {
    fwrite(STDERR, "Node login B failed with HTTP {$loginB}\n");
    exit(1);
}

if ($sessionA->me() !== 200 || $sessionB->me() !== 200) {
    fwrite(STDERR, "Authenticated /auth/me failed before revocation.\n");
    exit(1);
}

if ($sessionA->logoutOthers() !== 200) {
    fwrite(STDERR, "Logout others failed.\n");
    exit(1);
}

if ($sessionA->me() !== 200) {
    fwrite(STDERR, "Current session should remain authenticated after logout others.\n");
    exit(1);
}

if ($sessionB->me() !== 401) {
    fwrite(STDERR, "Revoked session should return 401 on /auth/me.\n");
    exit(1);
}

echo "PASS: multinode shared Redis session revocation verified.\n";
exit(0);
