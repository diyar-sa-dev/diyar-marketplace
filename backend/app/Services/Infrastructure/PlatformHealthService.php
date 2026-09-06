<?php

namespace App\Services\Infrastructure;

use App\Services\Payments\PaymentHealthService;
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
            'schema' => $this->probeSchema(),
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

        if (config('diyar.loadtest.enabled')) {
            $payload['runtime_probe'] = [
                'node_id' => (string) env('DIYAR_RUNTIME_NODE_ID', gethostname()),
                'hostname' => gethostname(),
                'pid' => getmypid(),
            ];
        }

        return $payload;
    }

    /**
     * @return array{ok: bool, driver: string, threads_connected?: int, max_connections?: int}
     */
    public function probeDatabase(): array
    {
        return $this->rememberProbe('database', function (): array {
            try {
                DB::connection()->getPdo();
                $payload = [
                    'ok' => true,
                    'driver' => (string) config('database.default'),
                ];

                if (DB::getDriverName() === 'mysql' && config('diyar.loadtest.enabled')) {
                    $status = collect(DB::select('SHOW GLOBAL STATUS WHERE Variable_name IN ("Threads_connected", "Max_used_connections")'))
                        ->mapWithKeys(fn ($row) => [$row->Variable_name => (int) $row->Value]);
                    $variables = collect(DB::select('SHOW VARIABLES LIKE "max_connections"'))
                        ->mapWithKeys(fn ($row) => [$row->Variable_name => (int) $row->Value]);

                    $payload['threads_connected'] = $status['Threads_connected'] ?? null;
                    $payload['max_used_connections'] = $status['Max_used_connections'] ?? null;
                    $payload['max_connections'] = $variables['max_connections'] ?? null;
                }

                return array_filter($payload, fn ($v) => $v !== null);
            } catch (Throwable) {
                return [
                    'ok' => false,
                    'driver' => (string) config('database.default'),
                ];
            }
        });
    }

    /**
     * @return array{ok: bool, driver: string, used_memory_human?: string, connected_clients?: int}
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

                $payload = [
                    'ok' => $ok,
                    'driver' => $driver,
                ];

                if ($driver === 'redis' && config('diyar.loadtest.enabled')) {
                    try {
                        $redis = Cache::getRedis()->connection();
                        $info = $redis->info();
                        $payload['used_memory_human'] = $info['used_memory_human'] ?? null;
                        $payload['connected_clients'] = isset($info['connected_clients']) ? (int) $info['connected_clients'] : null;
                    } catch (Throwable) {
                        // optional telemetry
                    }
                }

                return array_filter($payload, fn ($v) => $v !== null);
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
            $metrics = app(PaymentHealthService::class)->snapshot();
            $status = (string) ($metrics['status'] ?? 'ok');

            return [
                'ok' => $status === 'ok',
                'status' => $status,
                'metrics' => $metrics,
            ];
        });
    }
}
