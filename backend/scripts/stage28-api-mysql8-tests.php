<?php

declare(strict_types=1);

/**
 * Stage 28.3 — Run API-focused PHPUnit subset against MySQL 8 staging.
 * Usage: php scripts/stage28-api-mysql8-tests.php
 */
$root = dirname(__DIR__);
$outDir = dirname($root).'/conception/Stages/Stage 28/Phase 28.3 - Backend API Testing';
$filter = 'AuthenticationTest|OrderAuthorizationTest|OwnershipAuthorizationTest|ProductIdorTest|PaymentConcurrencyTest|RefundIdempotencyTest|RateLimitingTest|HealthEndpointTest';

$env = [
    'APP_ENV' => 'testing',
    'DB_CONNECTION' => 'mysql',
    'DB_HOST' => getenv('STAGE28_MYSQL8_HOST') ?: '127.0.0.1',
    'DB_PORT' => getenv('STAGE28_MYSQL8_PORT') ?: '3307',
    'DB_DATABASE' => getenv('STAGE28_MYSQL8_DATABASE') ?: 'diyar_staging',
    'DB_USERNAME' => getenv('STAGE28_MYSQL8_USERNAME') ?: 'diyar_staging',
    'DB_PASSWORD' => getenv('STAGE28_MYSQL8_PASSWORD') ?: 'staging_secret',
    'CACHE_STORE' => 'array',
    'QUEUE_CONNECTION' => 'sync',
    'SESSION_DRIVER' => 'array',
];

$cmd = [PHP_BINARY, 'artisan', 'test', '--filter='.$filter];
$procEnv = array_merge($_ENV, $env);
$proc = proc_open(
    $cmd,
    [1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
    $pipes,
    $root,
    $procEnv,
);
if (! is_resource($proc)) {
    fwrite(STDERR, "Failed to start PHPUnit\n");
    exit(1);
}
$stdout = stream_get_contents($pipes[1]);
$stderr = stream_get_contents($pipes[2]);
fclose($pipes[1]);
fclose($pipes[2]);
$code = proc_close($proc);

$result = [
    'timestamp_utc' => gmdate('c'),
    'environment' => 'MySQL 8 staging',
    'db' => [
        'host' => $env['DB_HOST'],
        'port' => $env['DB_PORT'],
        'database' => $env['DB_DATABASE'],
    ],
    'filter' => $filter,
    'exit_code' => $code,
    'stdout' => $stdout,
    'stderr' => $stderr,
];

@mkdir($outDir, 0777, true);
file_put_contents($outDir.'/_phpunit_mysql8_api.json', json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
file_put_contents($outDir.'/_phpunit_mysql8_api.txt', $stdout."\n".$stderr);

echo $stdout;
if ($stderr !== '') {
    fwrite(STDERR, $stderr);
}
exit($code);
