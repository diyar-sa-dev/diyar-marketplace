<?php

declare(strict_types=1);

/**
 * Reverb multi-instance fan-out probe (reverb-1 + reverb-2 behind Nginx).
 *
 * Usage (from host, stack running):
 *   php scripts/stage2817-reverb-multinode.php --base=http://127.0.0.1:8093 --key=<REVERB_APP_KEY>
 *
 * Or inside app container (Redis env auto-wired):
 *   docker exec diyar-production-app-1 php scripts/stage2817-reverb-multinode.php --base=http://nginx
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Broadcast;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$base = 'http://127.0.0.1:8093';
$key = (string) config('broadcasting.connections.reverb.key', 'diyar-reverb-key');
$timeoutSec = 20;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--base=')) {
        $base = rtrim(substr($arg, 7), '/');
    }
    if (str_starts_with($arg, '--key=')) {
        $key = substr($arg, 6);
    }
    if (str_starts_with($arg, '--timeout=')) {
        $timeoutSec = max(5, (int) substr($arg, 10));
    }
}

if (! config('reverb.servers.reverb.scaling.enabled')) {
    fwrite(STDERR, "REVERB_SCALING_ENABLED must be true\n");
    exit(2);
}

$wsHost = parse_url($base, PHP_URL_HOST) ?: '127.0.0.1';
$wsPort = (int) (parse_url($base, PHP_URL_PORT) ?: 80);
$wsPath = '/app/'.$key.'?protocol=7&client=php-probe&version=1.0';

function wsConnect(string $host, int $port, string $path): mixed
{
    $fp = @stream_socket_client("tcp://{$host}:{$port}", $errno, $errstr, 10);
    if (! $fp) {
        throw new RuntimeException("TCP connect failed: {$errstr} ({$errno})");
    }
    stream_set_timeout($fp, 15);
    $secKey = base64_encode(random_bytes(16));
    $headers = "GET {$path} HTTP/1.1\r\n".
        "Host: {$host}\r\n".
        "Upgrade: websocket\r\n".
        "Connection: Upgrade\r\n".
        "Sec-WebSocket-Key: {$secKey}\r\n".
        "Sec-WebSocket-Version: 13\r\n\r\n";
    fwrite($fp, $headers);
    $response = stream_get_contents($fp, 4096);
    if ($response === false || ! str_contains($response, '101')) {
        throw new RuntimeException('WebSocket upgrade failed: '.substr((string) $response, 0, 300));
    }

    return $fp;
}

function wsSend(mixed $fp, string $payload): void
{
    $len = strlen($payload);
    $frame = chr(0x81);
    if ($len <= 125) {
        $frame .= chr(0x80 | $len);
    } elseif ($len <= 65535) {
        $frame .= chr(0x80 | 126).pack('n', $len);
    } else {
        $frame .= chr(0x80 | 127).pack('J', $len);
    }
    $mask = random_bytes(4);
    $frame .= $mask;
    for ($i = 0; $i < $len; $i++) {
        $frame .= $payload[$i] ^ $mask[$i % 4];
    }
    fwrite($fp, $frame);
}

function wsReadPayload(mixed $fp, int $timeoutSec): ?string
{
    $deadline = microtime(true) + $timeoutSec;
    $buffer = '';
    while (microtime(true) < $deadline) {
        $chunk = fread($fp, 8192);
        if ($chunk === false || $chunk === '') {
            usleep(50_000);

            continue;
        }
        $buffer .= $chunk;
        if (str_contains($buffer, '{')) {
            return $buffer;
        }
    }

    return null;
}

$channel = 'reverb-multinode-probe';
$probeId = bin2hex(random_bytes(8));
$eventName = 'ProbePing';

echo "=== Reverb multi-instance probe ===\n";
echo "base={$base} channel={$channel} scaling=".json_encode(config('reverb.servers.reverb.scaling.enabled'))."\n";

$clients = [];
for ($i = 1; $i <= 2; $i++) {
    $fp = wsConnect($wsHost, $wsPort, $wsPath);
    wsSend($fp, json_encode([
        'event' => 'pusher:subscribe',
        'data' => ['channel' => $channel],
    ], JSON_THROW_ON_ERROR));
    $clients["client-{$i}"] = $fp;
    echo "client-{$i}: subscribed\n";
}

// Laravel → Reverb HTTP → Redis fan-out → all instances → WS clients
Broadcast::on($channel)->as($eventName)->with(['probe_id' => $probeId])->sendNow();

$received = [];
foreach ($clients as $name => $fp) {
    $raw = wsReadPayload($fp, $timeoutSec);
    $ok = is_string($raw) && str_contains($raw, $probeId);
    $received[$name] = $raw;
    echo "{$name}: ".($ok ? 'RECEIVED' : 'MISS')."\n";
}

$passCount = count(array_filter($received, fn ($r) => is_string($r) && str_contains($r, $probeId)));
$allOk = $passCount === 2;

$out = [
    'tool' => 'reverb-multinode-probe',
    'result' => $allOk ? 'passed' : 'failed',
    'received_count' => $passCount,
    'probe_id' => $probeId,
    'scaling_enabled' => config('reverb.servers.reverb.scaling.enabled'),
];

$rawDir = dirname(__DIR__, 2).'/conception/Stages/Stage 28/Phase 28.17 - Enterprise Concurrency & Octane Hardening/_raw';
if (is_dir($rawDir)) {
    file_put_contents($rawDir.'/reverb-multinode-'.date('Ymd-His').'.json', json_encode($out, JSON_PRETTY_PRINT));
}

echo $allOk ? "\nRESULT: PASS — both clients received fan-out\n" : "\nRESULT: FAIL — cross-instance delivery not proven ({$passCount}/2)\n";
exit($allOk ? 0 : 1);
