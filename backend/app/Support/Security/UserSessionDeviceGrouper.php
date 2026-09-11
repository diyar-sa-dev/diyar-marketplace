<?php

namespace App\Support\Security;

use App\Models\UserSession;
use Illuminate\Support\Collection;

final class UserSessionDeviceGrouper
{
    /**
     * @param  Collection<int, UserSession>  $sessions
     * @return Collection<int, UserSessionDeviceGroup>
     */
    public static function group(Collection $sessions, ?string $currentSessionHash): Collection
    {
        return $sessions
            ->groupBy(fn (UserSession $session): string => DeviceFingerprint::forSession($session))
            ->map(function (Collection $group, string $fingerprint) use ($currentSessionHash): UserSessionDeviceGroup {
                $sorted = $group
                    ->sortByDesc(fn (UserSession $session): string => (string) $session->last_activity_at?->getTimestamp())
                    ->values();

                $isCurrent = $currentSessionHash !== null
                    && $sorted->contains(
                        fn (UserSession $session): bool => $session->session_lookup_hash === $currentSessionHash,
                    );

                /** @var UserSession $primary */
                $primary = $sorted->first();

                return new UserSessionDeviceGroup(
                    fingerprint: $fingerprint,
                    primary: $primary,
                    sessions: $sorted,
                    isCurrent: $isCurrent,
                );
            })
            ->sortByDesc(fn (UserSessionDeviceGroup $group): string => (string) $group->lastActivityAt()?->getTimestamp())
            ->values();
    }
}
