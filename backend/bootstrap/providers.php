<?php

use App\Providers\AffiliateServiceProvider;
use App\Providers\AppServiceProvider;
use App\Providers\ChatServiceProvider;
use App\Providers\NotificationServiceProvider;

return [
    AppServiceProvider::class,
    NotificationServiceProvider::class,
    ChatServiceProvider::class,
    AffiliateServiceProvider::class,
];
