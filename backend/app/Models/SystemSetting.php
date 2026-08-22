<?php

namespace App\Models;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'group',
        'key',
        'value',
        'type',
        'is_public',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'group' => SystemSettingGroup::class,
            'type' => SystemSettingType::class,
            'value' => 'array',
            'is_public' => 'boolean',
        ];
    }

    public function fullKey(): string
    {
        return $this->group->value.'.'.$this->key;
    }

    public function rawValue(): mixed
    {
        $stored = $this->value;

        if (is_array($stored) && array_key_exists('v', $stored)) {
            return $stored['v'];
        }

        return $stored;
    }
}
