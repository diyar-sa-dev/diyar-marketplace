<?php

namespace App\Providers;

use App\Events\SettingsChanged;
use App\Listeners\Settings\InvalidateSettingsCacheListener;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class SettingsServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Event::listen(SettingsChanged::class, InvalidateSettingsCacheListener::class);
    }
}
