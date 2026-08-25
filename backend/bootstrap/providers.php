<?php

use App\Providers\AffiliateServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\ChatServiceProvider;
use App\Providers\NotificationServiceProvider;
use App\Providers\SettingsServiceProvider;

return [
    AffiliateServiceProvider::class,
    AppServiceProvider::class,
    ChatServiceProvider::class,
    LoyaltyServiceProvider::class,
    NotificationServiceProvider::class,
    SettingsServiceProvider::class,
];
