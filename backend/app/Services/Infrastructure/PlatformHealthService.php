<?php

namespace App\Services\Infrastructure;

use App\Services\Settings\EffectiveConfigService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Throwable;

final class PlatformHealthService
{
    /**
     * @return array{
     *     status: string,
     *     service: string,
     *     version: string|null,
     *     stage: string|null,
     *     timestamp: string,
     *     checks: array<string, array<string, mixed>>,
     *     maintenance: array<string, mixed>
     * }
     */
    public function buildPayload(bool $includeEnvironment): array
    {
        $database = $this->probeDatabase();
        $cache = $this->probeCache();
        $queue = $this->probeQueue();

        $checks = [
            'database' => $database,
            'cache' => $cache,
            'queue' => $queue,
            'payments' => $this->probePayments(),
        ];

        $allOk = collect($checks)->every(fn (array $check) => ($check['ok'] ?? false) === true);
        $status = $allOk ? 'ok' : 'degraded';

        $settings = app(EffectiveConfigService::class);

        $payload = [
            'status' => $status,
            'service' => 'diyar-api',
            'version' => config('diyar.api_version'),
            'stage' => config('diyar.stage'),
            'timestamp' => now()->toIso8601String(),
            'checks' => $checks,
            'maintenance' => [
                'marketplace_enabled' => $settings->boolean(
                    'platform.marketplace_maintenance_enabled',
                    (bool) config('diyar.maintenance.marketplace_enabled', false),
                ),
                'message_ar' => $settings->string(
                    'platform.maintenance_message_ar',
                    (string) config('diyar.maintenance.message_ar', ''),
                ),
                'message_en' => $settings->string(
                    'platform.maintenance_message_en',
                    (string) config('diyar.maintenance.message_en', ''),
                ),
            ],
        ];

        if ($includeEnvironment) {
            $payload['environment'] = app()->environment();
        }

        return $payload;
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    public function probeDatabase(): array
    {
        return $this->rememberProbe('database', function (): array {
            try {
                DB::connection()->getPdo();

                return [
                    'ok' => true,
                    'driver' => (string) config('database.default'),
                ];
            } catch (Throwable) {
                return [
                    'ok' => false,
                    'driver' => (string) config('database.default'),
                ];
            }
        });
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    public function probeCache(): array
    {
        return $this->rememberProbe('cache', function (): array {
            $driver = (string) config('cache.default');
            $probeKey = 'diyar:health:probe:'.uniqid('', true);

            try {
                Cache::put($probeKey, '1', 5);
                $ok = Cache::get($probeKey) === '1';
                Cache::forget($probeKey);

                return [
                    'ok' => $ok,
                    'driver' => $driver,
                ];
            } catch (Throwable) {
                return [
                    'ok' => false,
                    'driver' => $driver,
                ];
            }
        });
    }

    /**
     * @return array{ok: bool, driver: string, pending_jobs?: int, failed_jobs?: int}
     */
    public function probeQueue(): array
    {
        return $this->rememberProbe('queue', function (): array {
            $driver = (string) config('queue.default');

            try {
                $connection = Queue::connection();
                $size = method_exists($connection, 'size') ? (int) $connection->size('default') : null;
                $failedJobs = $this->countFailedJobs();

                return array_filter([
                    'ok' => true,
                    'driver' => $driver,
                    'pending_jobs' => $size,
                    'failed_jobs' => $failedJobs,
                ], fn ($value) => $value !== null);
            } catch (Throwable) {
                return [
                    'ok' => false,
                    'driver' => $driver,
                ];
            }
        });
    }

    /**
     * @param  callable(): array<string, mixed>  $callback
     * @return array<string, mixed>
     */
    private function rememberProbe(string $name, callable $callback): array
    {
        $ttl = (int) config('diyar.loadtest.health_probe_cache_seconds', 0);

        if ($ttl <= 0 || app()->runningUnitTests()) {
            return $callback();
        }

        return Cache::remember("diyar:health:probe:{$name}", $ttl, $callback);
    }

    private function countFailedJobs(): ?int
    {
        try {
            if (! DB::getSchemaBuilder()->hasTable('failed_jobs')) {
                return null;
            }

            return (int) DB::table('failed_jobs')->count();
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * @return array{ok: bool, status: string, metrics: array<string, mixed>}
     */
    private function probePayments(): array
    {
        return $this->rememberProbe('payments', function (): array {
            $metrics = app(\App\Services\Payments\PaymentHealthService::class)->snapshot();
            $status = (string) ($metrics['status'] ?? 'ok');

            return [
                'ok' => $status === 'ok',
                'status' => $status,
                'metrics' => $metrics,
            ];
        });
    }
}
