<?php

declare(strict_types=1);

use App\Enums\OtpPurpose;
use App\Models\User;
use App\Services\Identity\OtpService;
use App\Services\Security\TwoFactorChallengeStore;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/../../vendor/autoload.php';

$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

config([
    'cache.default' => 'array',
    'diyar.otp.test_mode' => true,
    'diyar.otp.test_code' => '123456',
]);

function percentile(array $samples, float $p): float
{
    sort($samples);
    $index = (int) ceil(($p / 100) * count($samples)) - 1;

    return round($samples[max(0, $index)], 3);
}

function benchmark(string $label, callable $callback, int $iterations = 50): array
{
    $samples = [];

    for ($i = 0; $i < $iterations; $i++) {
        $start = hrtime(true);
        $callback($i);
        $samples[] = (hrtime(true) - $start) / 1_000_000;
    }

    return [
        'label' => $label,
        'iterations' => $iterations,
        'p50_ms' => percentile($samples, 50),
        'p95_ms' => percentile($samples, 95),
        'p99_ms' => percentile($samples, 99),
    ];
}

$otp = app(OtpService::class);
$challenges = app(TwoFactorChallengeStore::class);

$results = [];

$results[] = benchmark('otp_issue', function (int $i) use ($otp): void {
    $phone = '966509'.str_pad((string) $i, 6, '0', STR_PAD_LEFT);
    $otp->issue($phone, OtpPurpose::Login, metadata: ['flow' => 'bench']);
});

$results[] = benchmark('otp_verify', function (int $i) use ($otp): void {
    $phone = '966508'.str_pad((string) $i, 6, '0', STR_PAD_LEFT);
    $otp->issue($phone, OtpPurpose::Login, metadata: ['flow' => 'bench']);
    $otp->verify($phone, OtpPurpose::Login, '123456');
});

$results[] = benchmark('challenge_create', function () use ($challenges): void {
    $challenges->create((string) str()->uuid(), false);
});

$user = User::factory()->make(['id' => (string) str()->uuid()]);
$results[] = benchmark('login_without_2fa_auth_check', function () use ($user): void {
    $user->hasTwoFactorEnabled();
});

echo json_encode([
    'generated_at' => now()->toIso8601String(),
    'environment' => app()->environment(),
    'cache_driver' => config('cache.default'),
    'results' => $results,
], JSON_PRETTY_PRINT).PHP_EOL;
