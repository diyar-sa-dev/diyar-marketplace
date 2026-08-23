<?php

namespace App\Http\Middleware;

use App\Services\Settings\EffectiveConfigService;
use App\Support\Api\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class EnsureMarketplaceNotInMaintenance
{
    /**
     * @var list<string>
     */
    private const EXEMPT_PREFIXES = [
        'api/v1/health',
        'api/v1/readiness',
        'api/v1/admin',
        'api/v1/webhooks',
        'api/v1/platform/theme',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        if ($this->isExempt($request)) {
            return $next($request);
        }

        $settings = app(EffectiveConfigService::class);
        $enabled = $settings->boolean(
            'platform.marketplace_maintenance_enabled',
            (bool) config('diyar.maintenance.marketplace_enabled', false),
        );

        if (! $enabled) {
            return $next($request);
        }

        $locale = app()->getLocale();
        $messageAr = $settings->string(
            'platform.maintenance_message_ar',
            (string) config('diyar.maintenance.message_ar', ''),
        );
        $messageEn = $settings->string(
            'platform.maintenance_message_en',
            (string) config('diyar.maintenance.message_en', ''),
        );

        $message = str_starts_with($locale, 'ar')
            ? ($messageAr !== '' ? $messageAr : $messageEn)
            : ($messageEn !== '' ? $messageEn : $messageAr);

        return ApiResponse::error(
            $message !== '' ? $message : __('diyar.maintenance.marketplace_unavailable'),
            503,
        );
    }

    private function isExempt(Request $request): bool
    {
        $path = trim($request->path(), '/');

        foreach (self::EXEMPT_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }
}
