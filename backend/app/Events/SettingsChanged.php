<?php

namespace App\Events;

use App\Enums\SystemSettingGroup;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class SettingsChanged
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly SystemSettingGroup $group,
        public readonly string $key,
        public readonly mixed $oldValue,
        public readonly mixed $newValue,
    ) {}
}
