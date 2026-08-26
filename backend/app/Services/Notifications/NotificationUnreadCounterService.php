<?php

namespace App\Services\Notifications;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Cache;

final class NotificationUnreadCounterService
{
    private function prefix(): string
    {
        return (string) config('diyar.notifications.cache.prefix', 'diyar:notifications:');
    }

    public function keyForUser(string $userId): string
    {
        return $this->prefix()."unread:{$userId}";
    }

    public function get(User $user): int
    {
        try {
            $ttl = (int) config('diyar.notifications.cache.unread_ttl', 300);
            $key = $this->keyForUser($user->id);

            $cached = Cache::get($key);
            if (is_int($cached) || (is_string($cached) && ctype_digit($cached))) {
                return max(0, (int) $cached);
            }

            return $this->rebuild($user);
        } catch (\Throwable) {
            return $this->countUnreadFromDatabase($user);
        }
    }

    public function increment(User $user, int $by = 1): int
    {
        if ($by <= 0) {
            return $this->get($user);
        }

        $key = $this->keyForUser($user->id);

        if (! Cache::has($key)) {
            return $this->rebuild($user);
        }

        $value = (int) Cache::increment($key, $by);

        return max(0, $value);
    }

    public function decrement(User $user, int $by = 1): int
    {
        if ($by <= 0) {
            return $this->get($user);
        }

        $key = $this->keyForUser($user->id);

        if (! Cache::has($key)) {
            return $this->rebuild($user);
        }

        $current = (int) Cache::get($key, 0);
        $next = max(0, $current - $by);
        Cache::put($key, $next, (int) config('diyar.notifications.cache.unread_ttl', 300));

        return $next;
    }

    public function markAllRead(User $user): void
    {
        Cache::put(
            $this->keyForUser($user->id),
            0,
            (int) config('diyar.notifications.cache.unread_ttl', 300),
        );
    }

    public function forget(string $userId): void
    {
        Cache::forget($this->keyForUser($userId));
    }

    public function rebuild(User $user): int
    {
        $count = $this->countUnreadFromDatabase($user);

        try {
            Cache::put(
                $this->keyForUser($user->id),
                $count,
                (int) config('diyar.notifications.cache.unread_ttl', 300),
            );
        } catch (\Throwable) {
            // Cache unavailable — still return the authoritative DB count.
        }

        return $count;
    }

    private function countUnreadFromDatabase(User $user): int
    {
        return (int) UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    public function reconcile(string $userId): int
    {
        $this->forget($userId);

        $user = User::query()->find($userId);

        return $user instanceof User ? $this->rebuild($user) : 0;
    }
}
