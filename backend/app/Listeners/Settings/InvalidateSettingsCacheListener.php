<?php

namespace App\Listeners\Settings;

use App\Events\SettingsChanged;
use App\Services\Settings\EffectiveConfigService;

final class InvalidateSettingsCacheListener
{
    public function __construct(
        private readonly EffectiveConfigService $config,
    ) {}

    public function handle(SettingsChanged $event): void
    {
        $this->config->invalidate("{$event->group->value}.{$event->key}");
    }
}
