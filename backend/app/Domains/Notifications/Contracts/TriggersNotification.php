<?php

namespace App\Domains\Notifications\Contracts;

use App\Domains\Notifications\Services\NotificationIntent;

interface TriggersNotification
{
    public function toNotificationIntent(): NotificationIntent;
}
