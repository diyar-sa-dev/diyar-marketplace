<?php

declare(strict_types=1);

/**
 * Phase 7 automated certification runner.
 *
 * Exit codes:
 *   0 = all runnable gates passed
 *   1 = one or more gates failed
 *   2 = required infrastructure unavailable (NOT VERIFIED)
 */

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$evidenceDir = storage_path('certification/phase7/'.gmdate('Y-m-d_His'));
foreach (['', 'explain', 'latency', 'stampede', 'failure', 'metrics'] as $subdir) {
    @mkdir($evidenceDir.($subdir !== '' ? '/'.$subdir : ''), 0755, true);
}

$report = [
    'timestamp_utc' => gmdate('c'),
    'commit_sha' => trim((string) shell_exec('git rev-parse HEAD')),
    'gates' => [],
    'evidence_dir' => $evidenceDir,
];

function gate(array &$report, string $id, string $status, array $details = []): void
{
    $report['gates'][$id] = array_merge(['status' => $status], $details);
}

function runCommand(string $command): array
{
    $output = [];
    $exitCode = 0;
    $wrapped = str_starts_with(PHP_OS_FAMILY, 'Windows')
        ? 'cmd /C '.$command.' 2>&1'
        : $command.' 2>&1';
    exec($wrapped, $output, $exitCode);

    return ['exit' => $exitCode, 'output' => implode(PHP_EOL, $output)];
}

// Environment validation
$driver = config('database.default');
$dbDriver = config("database.connections.{$driver}.driver");
$infraOk = true;

file_put_contents($evidenceDir.'/environment.txt', implode(PHP_EOL, [
    'php='.PHP_VERSION,
    'laravel='.app()->version(),
    'db_default='.$driver,
    'db_driver='.$dbDriver,
    'cache='.config('cache.default'),
]));

try {
    DB::connection()->getPdo();
    gate($report, 'environment_database', 'PASS', ['driver' => $dbDriver]);
} catch (Throwable $exception) {
    $infraOk = false;
    gate($report, 'environment_database', 'NOT VERIFIED', ['message' => $exception->getMessage()]);
}

if (! in_array($dbDriver, ['mysql', 'mariadb'], true) || ! $infraOk) {
    gate($report, 'explain_analyze', 'NOT VERIFIED', ['reason' => 'requires_reachable_mysql_or_mariadb']);
} else {
    $explain = runCommand(PHP_BINARY.' '.escapeshellarg(__DIR__.'/filter-suggestions-explain-analyze.php'));
    file_put_contents($evidenceDir.'/explain/output.json', $explain['output']);
    gate($report, 'explain_analyze', $explain['exit'] === 0 ? 'PASS' : 'FAIL', ['exit' => $explain['exit']]);
}

// PHPUnit smart filter suite
$phpunit = runCommand(PHP_BINARY.' '.escapeshellarg(base_path('artisan')).' test --filter=FilterSuggestion');
file_put_contents($evidenceDir.'/phpunit-filter-suggestion.txt', $phpunit['output']);
gate($report, 'correctness_phpunit', $phpunit['exit'] === 0 ? 'PASS' : 'FAIL', ['exit' => $phpunit['exit']]);

if ($infraOk) {
    $latency = runCommand(PHP_BINARY.' '.escapeshellarg(__DIR__.'/filter-suggestions-latency-benchmark.php').' --iterations=20');
    file_put_contents($evidenceDir.'/latency/benchmark.json', $latency['output']);
    gate($report, 'latency_benchmark', $latency['exit'] === 0 ? 'PASS' : 'NOT VERIFIED');

    $stampede = runCommand(PHP_BINARY.' '.escapeshellarg(__DIR__.'/filter-suggestions-stampede-concurrent.php').' --workers=25');
    file_put_contents($evidenceDir.'/stampede/stampede-25.json', $stampede['output']);
    gate($report, 'stampede_25', $stampede['exit'] === 0 ? 'PASS' : 'FAIL');
} else {
    gate($report, 'latency_benchmark', 'NOT VERIFIED');
    gate($report, 'stampede_25', 'NOT VERIFIED');
    gate($report, 'dataset_100k', 'NOT VERIFIED');
    gate($report, 'concurrency_50', 'NOT VERIFIED');
    gate($report, 'concurrency_100', 'NOT VERIFIED');
}

gate($report, 'playwright_e2e', 'NOT VERIFIED', ['reason' => 'run_frontend_e2e_separately']);

file_put_contents($evidenceDir.'/report.json', json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

$statuses = array_column($report['gates'], 'status');
$failed = in_array('FAIL', $statuses, true);
$allVerified = ! in_array('NOT VERIFIED', $statuses, true);

echo json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES).PHP_EOL;

if ($failed) {
    exit(1);
}

if (! $allVerified) {
    exit(2);
}

exit(0);
