<?php

namespace App\Services\Notifications;

use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

final class NotificationService
{
    public function __construct(
        private readonly NotificationRealtimeBroadcaster $realtime,
        private readonly NotificationCategoryRegistry $registry,
    ) {}

    public function unreadCount(User $user): int
    {
        return UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->count();
    }

    /**
     * @return LengthAwarePaginator<int, UserNotification>
     */
    public function paginate(
        User $user,
        int $page,
        int $perPage,
        ?bool $unreadOnly = null,
        ?bool $readOnly = null,
        ?string $category = null,
    ): LengthAwarePaginator {
        $query = UserNotification::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');

        if ($unreadOnly === true) {
            $query->whereNull('read_at');
        }

        if ($readOnly === true) {
            $query->whereNotNull('read_at');
        }

        if (is_string($category) && $category !== '' && $category !== 'all') {
            $types = $this->registry->typesForCategory($category);
            if ($types === []) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('type', $types);
            }
        }

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function markAsRead(User $user, string $notificationId): UserNotification
    {
        $notification = $this->findOwned($user, $notificationId);
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        $fresh = $notification->fresh();
        $this->realtime->readStateChanged(
            $user->id,
            $this->unreadCount($user),
            'read',
            $fresh?->id,
        );

        return $fresh ?? $notification;
    }

    public function markAllAsRead(User $user): int
    {
        $count = UserNotification::query()
            ->where('user_id', $user->id)
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        $this->realtime->readStateChanged($user->id, 0, 'read_all');

        return $count;
    }

    public function delete(User $user, string $notificationId): void
    {
        $notification = $this->findOwned($user, $notificationId);
        $wasUnread = $notification->read_at === null;
        $notification->delete();

        if ($wasUnread) {
            $this->realtime->readStateChanged(
                $user->id,
                $this->unreadCount($user),
                'deleted',
                $notificationId,
            );
        }
    }

    public function deleteAll(User $user): int
    {
        $count = UserNotification::query()
            ->where('user_id', $user->id)
            ->delete();

        $this->realtime->readStateChanged($user->id, 0, 'deleted_all');

        return $count;
    }

    private function findOwned(User $user, string $notificationId): UserNotification
    {
        return UserNotification::query()
            ->whereKey($notificationId)
            ->where('user_id', $user->id)
            ->firstOrFail();
    }
}
