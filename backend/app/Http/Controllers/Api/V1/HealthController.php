<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Settings\EffectiveConfigService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $database = $this->probeDatabase();
        $cache = $this->probeCache();

        $status = ($database['ok'] && $cache['ok']) ? 'ok' : 'degraded';

        $settings = app(EffectiveConfigService::class);

        $payload = [
            'status' => $status,
            'service' => 'diyar-api',
            'version' => config('diyar.api_version'),
            'stage' => config('diyar.stage'),
            'timestamp' => now()->toIso8601String(),
            'checks' => [
                'database' => $database,
                'cache' => $cache,
            ],
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

        if (! app()->environment('production')) {
            $payload['environment'] = app()->environment();
        }

        return ApiResponse::success($payload, null, $status === 'ok' ? 200 : 503);
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    private function probeDatabase(): array
    {
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
    }

    /**
     * @return array{ok: bool, driver: string}
     */
    private function probeCache(): array
    {
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
    }
}
