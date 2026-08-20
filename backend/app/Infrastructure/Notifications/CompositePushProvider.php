<?php

namespace App\Infrastructure\Notifications;

use App\Contracts\Notifications\PushProviderInterface;
use App\Models\NotificationDevice;
use App\Models\User;
use App\Models\UserNotification;

final class CompositePushProvider implements PushProviderInterface
{
    public function __construct(
        private readonly FcmPushProvider $fcm,
        private readonly ApnsPushProvider $apns,
        private readonly LogPushProvider $log,
    ) {}

    public function send(User $recipient, UserNotification $notification, array $devices, array $payload): PushSendResult
    {
        $driver = config('diyar.notifications.push.driver', 'log');

        if ($driver === 'log') {
            return $this->log->send($recipient, $notification, $devices, $payload);
        }

        $fcmDevices = array_values(array_filter(
            $devices,
            fn ($device) => $device instanceof NotificationDevice
                && in_array($device->platform, ['android', 'web'], true),
        ));
        $apnsDevices = array_values(array_filter(
            $devices,
            fn ($device) => $device instanceof NotificationDevice && $device->platform === 'ios',
        ));

        $invalidDeviceIds = [];

        if ($fcmDevices !== [] && in_array($driver, ['fcm', 'multi'], true)) {
            $result = $this->fcm->send($recipient, $notification, $fcmDevices, $payload);
            $invalidDeviceIds = array_merge($invalidDeviceIds, $result->invalidDeviceIds);
        }

        if ($apnsDevices !== [] && in_array($driver, ['apns', 'multi'], true)) {
            $result = $this->apns->send($recipient, $notification, $apnsDevices, $payload);
            $invalidDeviceIds = array_merge($invalidDeviceIds, $result->invalidDeviceIds);
        }

        if ($fcmDevices === [] && $apnsDevices === [] && $driver !== 'log') {
            return $this->log->send($recipient, $notification, $devices, $payload);
        }

        return new PushSendResult(invalidDeviceIds: array_values(array_unique($invalidDeviceIds)));
    }
}
