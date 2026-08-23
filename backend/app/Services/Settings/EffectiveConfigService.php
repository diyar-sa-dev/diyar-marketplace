<?php

namespace App\Services\Settings;

use App\Enums\SystemSettingGroup;
use App\Models\SystemSetting;
use Illuminate\Support\Facades\Cache;

final class EffectiveConfigService
{
    public function get(string $fullKey, mixed $default = null): mixed
    {
        if (app()->environment('testing')) {
            return $this->resolve($fullKey, $default);
        }

        return Cache::remember(
            $this->cacheKey($fullKey),
            $this->cacheTtl(),
            fn (): mixed => $this->resolve($fullKey, $default),
        );
    }

    public function string(string $fullKey, ?string $default = null): string
    {
        $value = $this->get($fullKey, $default);

        return (string) ($value ?? $default ?? '');
    }

    public function integer(string $fullKey, ?int $default = null): int
    {
        $value = $this->get($fullKey, $default);

        return (int) ($value ?? $default ?? 0);
    }

    public function decimal(string $fullKey, float|string|null $default = null): float
    {
        $value = $this->get($fullKey, $default);

        return (float) ($value ?? $default ?? 0);
    }

    public function boolean(string $fullKey, ?bool $default = null): bool
    {
        $value = $this->get($fullKey, $default);

        if ($value === null) {
            return (bool) $default;
        }

        return filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? (bool) $value;
    }

    public function invalidate(string $fullKey): void
    {
        Cache::forget($this->cacheKey($fullKey));
    }

    public function invalidateGroup(SystemSettingGroup $group): void
    {
        SystemSetting::query()
            ->where('group', $group->value)
            ->pluck('key')
            ->each(fn (string $key): mixed => $this->invalidate("{$group->value}.{$key}"));
    }

    /**
     * @return array<string, mixed>
     */
    public function publicThemeTokens(): array
    {
        return SystemSetting::query()
            ->where('group', SystemSettingGroup::Theme->value)
            ->where('is_public', true)
            ->orderBy('key')
            ->get()
            ->mapWithKeys(function (SystemSetting $setting): array {
                $value = $this->get($setting->fullKey(), $setting->rawValue());

                return [$setting->key => $value];
            })
            ->all();
    }

    private function resolve(string $fullKey, mixed $default = null): mixed
    {
        [$group, $key] = $this->parseFullKey($fullKey);

        $setting = SystemSetting::query()
            ->where('group', $group)
            ->where('key', $key)
            ->first();

        if ($setting !== null) {
            return app(SystemSettingService::class)->cast($setting->rawValue(), $setting->type);
        }

        $definitions = config('system_settings.definitions', []);
        $definition = is_array($definitions) ? ($definitions[$fullKey] ?? null) : null;
        if (is_array($definition) && isset($definition['config_path'])) {
            $configValue = config($definition['config_path']);
            if ($configValue !== null) {
                return $configValue;
            }
        }

        $configValue = config("diyar.{$group}.{$key}");
        if ($configValue !== null) {
            return $configValue;
        }

        return $default;
    }

    /** @return array{0: string, 1: string} */
    private function parseFullKey(string $fullKey): array
    {
        $parts = explode('.', $fullKey, 2);

        if (count($parts) !== 2) {
            throw new \InvalidArgumentException("Invalid setting key [{$fullKey}]. Expected group.key format.");
        }

        return [$parts[0], $parts[1]];
    }

    private function cacheKey(string $fullKey): string
    {
        return config('system_settings.cache_prefix', 'diyar:settings:').$fullKey;
    }

    private function cacheTtl(): int
    {
        return max(60, (int) config('system_settings.cache_ttl_seconds', 3600));
    }
}
