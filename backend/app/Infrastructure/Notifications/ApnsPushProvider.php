<?php

namespace App\Infrastructure\Notifications;

use App\Contracts\Notifications\PushProviderInterface;
use App\Models\User;
use App\Models\UserNotification;

final class ApnsPushProvider implements PushProviderInterface
{
    public function send(User $recipient, UserNotification $notification, array $devices, array $payload): PushSendResult
    {
        $keyId = config('diyar.notifications.push.apns.key_id');
        $teamId = config('diyar.notifications.push.apns.team_id');
        $bundleId = config('diyar.notifications.push.apns.bundle_id');
        $privateKey = config('diyar.notifications.push.apns.private_key');

        if (! is_string($keyId) || $keyId === ''
            || ! is_string($teamId) || $teamId === ''
            || ! is_string($bundleId) || $bundleId === ''
            || ! is_string($privateKey) || $privateKey === '') {
            throw new PushProviderException('APNs is not configured.', permanent: true);
        }

        throw new PushProviderException('APNs delivery is not enabled in this environment.');
    }
}
