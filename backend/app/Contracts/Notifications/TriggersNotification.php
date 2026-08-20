<?php

namespace App\Contracts\Notifications;

use App\Services\Notifications\NotificationIntent;

interface TriggersNotification
{
    public function toNotificationIntent(): NotificationIntent;
}
