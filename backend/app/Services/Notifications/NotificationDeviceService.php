<?php

namespace App\Services\Notifications;

use App\Models\NotificationDevice;
use App\Models\User;

final class NotificationDeviceService
{
    public function register(
        User $user,
        string $token,
        string $platform,
        ?string $deviceIdentifier = null,
    ): NotificationDevice {
        return NotificationDevice::query()->updateOrCreate(
            [
                'user_id' => $user->id,
                'token' => $token,
            ],
            [
                'platform' => $platform,
                'device_identifier' => $deviceIdentifier,
                'active' => true,
                'last_used_at' => now(),
            ],
        );
    }

    public function deactivate(User $user, string $token): void
    {
        NotificationDevice::query()
            ->where('user_id', $user->id)
            ->where('token', $token)
            ->update(['active' => false]);
    }

    /**
     * @param  list<string>  $deviceIds
     */
    public function deactivateByIds(User $user, array $deviceIds): void
    {
        if ($deviceIds === []) {
            return;
        }

        NotificationDevice::query()
            ->where('user_id', $user->id)
            ->whereIn('id', $deviceIds)
            ->update(['active' => false]);
    }
}
