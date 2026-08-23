<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\Settings\EffectiveConfigService;
use App\Services\Settings\SystemSettingService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminSystemSettingController extends Controller
{
    public function __construct(
        private readonly SystemSettingService $settings,
        private readonly EffectiveConfigService $config,
    ) {}

    public function index(): JsonResponse
    {
        /** @var array<string, array<string, mixed>> $definitions */
        $definitions = config('system_settings.definitions', []);
        $items = [];

        foreach ($definitions as $fullKey => $definition) {
            $group = SystemSettingGroup::from((string) $definition['group']);
            $key = (string) $definition['key'];
            $type = SystemSettingType::from((string) $definition['type']);

            $stored = SystemSetting::query()
                ->where('group', $group->value)
                ->where('key', $key)
                ->first();

            $effectiveValue = $this->config->get($fullKey);

            $items[] = [
                'group' => $group->value,
                'key' => $key,
                'full_key' => $fullKey,
                'type' => $type->value,
                'effective_value' => $effectiveValue,
                'stored_value' => $stored !== null
                    ? $this->settings->cast($stored->rawValue(), $type)
                    : null,
                'is_public' => (bool) ($stored?->is_public ?? ($definition['is_public'] ?? false)),
                'description' => $stored?->description,
                'has_override' => $stored !== null,
            ];
        }

        return ApiResponse::success(data: [
            'settings' => $items,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'group' => ['required', 'string'],
            'key' => ['required', 'string'],
            'value' => ['present'],
        ]);

        $fullKey = $validated['group'].'.'.$validated['key'];

        /** @var array<string, array<string, mixed>> $definitions */
        $definitions = config('system_settings.definitions', []);

        if (! isset($definitions[$fullKey])) {
            abort(404, __('admin.settings.errors.unknown_key'));
        }

        $definition = $definitions[$fullKey];
        $group = SystemSettingGroup::from((string) $definition['group']);
        $type = SystemSettingType::from((string) $definition['type']);
        $rules = is_array($definition['validation'] ?? null) ? $definition['validation'] : [];

        if (isset($definition['allowed_values']) && is_array($definition['allowed_values'])) {
            $rules[] = Rule::in($definition['allowed_values']);
        }

        try {
            $setting = $this->settings->set(
                group: $group,
                key: (string) $definition['key'],
                value: $validated['value'],
                type: $type,
                actor: $request->user('admin'),
                isPublic: (bool) ($definition['is_public'] ?? false),
                description: isset($definition['description']) ? (string) $definition['description'] : null,
                rules: is_array($rules) ? $rules : [],
            );
        } catch (ValidationException $exception) {
            throw $exception;
        }

        return ApiResponse::success(data: [
            'setting' => [
                'group' => $setting->group->value,
                'key' => $setting->key,
                'full_key' => $setting->fullKey(),
                'type' => $setting->type->value,
                'stored_value' => $this->settings->cast($setting->rawValue(), $setting->type),
                'effective_value' => $this->config->get($fullKey),
                'is_public' => $setting->is_public,
                'has_override' => true,
            ],
        ]);
    }
}
