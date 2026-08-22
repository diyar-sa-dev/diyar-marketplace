<?php

namespace Database\Seeders;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Models\SystemSetting;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class SystemSettingSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = config('system_settings.definitions', []);

        foreach ($definitions as $fullKey => $definition) {
            if (! is_array($definition)) {
                continue;
            }

            $group = SystemSettingGroup::from($definition['group']);
            $key = $definition['key'];
            $type = SystemSettingType::from($definition['type']);
            $configPath = $definition['config_path'] ?? null;
            $isPublic = (bool) ($definition['is_public'] ?? false);

            if ($configPath === null) {
                continue;
            }

            $rawValue = config($configPath);

            if ($rawValue === null) {
                continue;
            }

            SystemSetting::query()->updateOrCreate(
                [
                    'group' => $group->value,
                    'key' => $key,
                ],
                [
                    'id' => SystemSetting::query()
                        ->where('group', $group->value)
                        ->where('key', $key)
                        ->value('id') ?? (string) Str::uuid(),
                    'value' => ['v' => $rawValue],
                    'type' => $type->value,
                    'is_public' => $isPublic,
                    'description' => trans('admin.settings.descriptions.'.$fullKey, [], 'en'),
                ],
            );
        }
    }
}
