<?php

namespace App\Services\Settings;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Events\SettingsChanged;
use App\Models\SystemSetting;
use App\Models\User;
use App\Services\Admin\AdminAuditService;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;

final class SystemSettingService
{
    /** @var list<string> */
    private const SENSITIVE_KEY_PATTERNS = [
        'password',
        'secret',
        'api_key',
        'token',
        'credential',
        'private_key',
        'card',
        'cvv',
    ];

    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function get(SystemSettingGroup $group, string $key): mixed
    {
        $setting = SystemSetting::query()
            ->where('group', $group->value)
            ->where('key', $key)
            ->first();

        if ($setting === null) {
            return null;
        }

        return $this->cast($setting->rawValue(), $setting->type);
    }

    /**
     * @param  array<int, string|ValidationRule>  $rules
     */
    public function set(
        SystemSettingGroup $group,
        string $key,
        mixed $value,
        SystemSettingType $type,
        ?User $actor = null,
        bool $isPublic = false,
        ?string $description = null,
        array $rules = [],
    ): SystemSetting {
        if ($this->isSensitiveKey($key) && $isPublic) {
            throw new InvalidArgumentException(__('admin.settings.errors.sensitive_not_public'));
        }

        $validatedValue = $this->validate($value, $type, $rules);

        return DB::transaction(function () use ($group, $key, $validatedValue, $type, $actor, $isPublic, $description): SystemSetting {
            $existing = SystemSetting::query()
                ->where('group', $group->value)
                ->where('key', $key)
                ->first();

            $oldValue = $existing?->rawValue();

            $setting = SystemSetting::query()->updateOrCreate(
                [
                    'group' => $group->value,
                    'key' => $key,
                ],
                [
                    'value' => ['v' => $validatedValue],
                    'type' => $type->value,
                    'is_public' => $isPublic,
                    'description' => $description,
                ],
            );

            if ($actor !== null) {
                $this->audit->record(
                    actor: $actor,
                    action: 'settings.updated',
                    resource: $setting,
                    before: $existing !== null ? ['value' => $this->maskIfSensitive($key, $oldValue)] : null,
                    after: ['value' => $this->maskIfSensitive($key, $validatedValue)],
                );
            }

            event(new SettingsChanged($group, $key, $oldValue, $validatedValue));

            return $setting->fresh();
        });
    }

    /**
     * @param  array<int, string|ValidationRule>  $rules
     */
    public function validate(mixed $value, SystemSettingType $type, array $rules = []): mixed
    {
        if ($type === SystemSettingType::Boolean) {
            $value = $this->normalizeBooleanInput($value);
        }

        $payload = ['value' => $value];

        $resolvedRules = $rules !== [] ? $rules : $this->defaultRulesForType($type);

        $validator = Validator::make($payload, [
            'value' => $resolvedRules,
        ]);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }

        return $this->cast($value, $type);
    }

    public function cast(mixed $value, SystemSettingType $type): mixed
    {
        return match ($type) {
            SystemSettingType::String, SystemSettingType::Color => (string) $value,
            SystemSettingType::Integer => (int) $value,
            SystemSettingType::Decimal => is_numeric($value) ? (float) $value : $value,
            SystemSettingType::Boolean => filter_var($value, FILTER_VALIDATE_BOOL, FILTER_NULL_ON_FAILURE) ?? (bool) $value,
            SystemSettingType::Json => is_array($value) ? $value : json_decode((string) $value, true),
        };
    }

    public function isSensitiveKey(string $key): bool
    {
        $normalized = Str::lower($key);

        foreach (array_merge(self::SENSITIVE_KEY_PATTERNS, config('system_settings.sensitive_key_patterns', [])) as $pattern) {
            if (Str::contains($normalized, Str::lower($pattern))) {
                return true;
            }
        }

        return false;
    }

    public function maskIfSensitive(string $key, mixed $value): mixed
    {
        if (! $this->isSensitiveKey($key)) {
            return $value;
        }

        return '********';
    }

    /** @return array<string, mixed>|null */
    public function definition(string $fullKey): ?array
    {
        $definition = config("system_settings.definitions.{$fullKey}");

        return is_array($definition) ? $definition : null;
    }

    /** @return array<int, string> */
    private function defaultRulesForType(SystemSettingType $type): array
    {
        return match ($type) {
            SystemSettingType::String => ['required', 'string'],
            SystemSettingType::Color => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            SystemSettingType::Integer => ['required', 'integer'],
            SystemSettingType::Decimal => ['required', 'numeric'],
            SystemSettingType::Boolean => ['required', 'boolean'],
            SystemSettingType::Json => ['required', 'array'],
        };
    }

    private function normalizeBooleanInput(mixed $value): mixed
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            return (bool) $value;
        }

        if (! is_string($value)) {
            return $value;
        }

        $normalized = strtolower(trim($value));

        return match ($normalized) {
            '1', 'true', 'on', 'yes' => true,
            '0', 'false', 'off', 'no', '' => false,
            default => $value,
        };
    }
}
