<?php

namespace App\Services\Notifications;

use App\Enums\NotificationBroadcastAudience;
use App\Enums\NotificationBroadcastStatus;
use App\Enums\NotificationPriority;
use App\Enums\RoleName;
use App\Jobs\Notifications\ProcessNotificationBroadcastJob;
use App\Models\NotificationBroadcast;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;
use InvalidArgumentException;

final class NotificationBroadcastService
{
    /**
     * @param  list<string>  $channels
     * @param  array<string, mixed>  $audienceFilter
     */
    public function create(
        User $admin,
        string $title,
        string $body,
        string $category,
        array $channels,
        NotificationBroadcastAudience $audienceType,
        array $audienceFilter,
        NotificationPriority $priority,
        ?\DateTimeInterface $scheduledAt = null,
        ?\DateTimeInterface $expiresAt = null,
    ): NotificationBroadcast {
        if ($title === '' || $body === '') {
            throw new InvalidArgumentException('Title and body are required.');
        }

        if ($channels === []) {
            throw new InvalidArgumentException('At least one channel is required.');
        }

        $this->validateAudience($audienceType, $audienceFilter);

        $broadcast = NotificationBroadcast::query()->create([
            'created_by' => $admin->id,
            'title' => $title,
            'body' => $body,
            'category' => $category,
            'channels' => $channels,
            'audience_type' => $audienceType,
            'audience_filter' => $audienceFilter !== [] ? $audienceFilter : null,
            'priority' => $priority,
            'status' => NotificationBroadcastStatus::Pending,
            'total_recipients' => $this->countAudience($audienceType, $audienceFilter),
            'scheduled_at' => $scheduledAt,
            'expires_at' => $expiresAt,
        ]);

        if ($scheduledAt === null || $scheduledAt <= now()) {
            ProcessNotificationBroadcastJob::dispatch($broadcast->id)
                ->afterCommit()
                ->onQueue('broadcast');
        }

        return $broadcast;
    }

    /**
     * @param  array<string, mixed>  $audienceFilter
     */
    public function audienceQuery(NotificationBroadcastAudience $audienceType, array $audienceFilter): Builder
    {
        $query = User::query();

        return match ($audienceType) {
            NotificationBroadcastAudience::All => $query,
            NotificationBroadcastAudience::Role => $query->whereHas('roles', function (Builder $roleQuery) use ($audienceFilter) {
                $roleQuery->where('name', (string) ($audienceFilter['role'] ?? ''));
            }),
            NotificationBroadcastAudience::Customer => $query->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('name', RoleName::Customer->value)),
            NotificationBroadcastAudience::Vendor => $query->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('name', RoleName::Vendor->value)),
            NotificationBroadcastAudience::Provider => $query->whereHas('roles', fn (Builder $roleQuery) => $roleQuery->where('name', RoleName::Provider->value)),
            NotificationBroadcastAudience::SelectedUsers => $query->whereIn('id', array_values(array_filter(
                is_array($audienceFilter['user_ids'] ?? null) ? $audienceFilter['user_ids'] : [],
                fn ($id) => is_string($id) && Str::isUuid($id),
            ))),
        };
    }

    /**
     * @param  array<string, mixed>  $audienceFilter
     */
    private function countAudience(NotificationBroadcastAudience $audienceType, array $audienceFilter): int
    {
        return $this->audienceQuery($audienceType, $audienceFilter)->count();
    }

    /**
     * @param  array<string, mixed>  $audienceFilter
     */
    private function validateAudience(NotificationBroadcastAudience $audienceType, array $audienceFilter): void
    {
        if ($audienceType === NotificationBroadcastAudience::Role && empty($audienceFilter['role'])) {
            throw new InvalidArgumentException('Role audience requires audience_filter.role.');
        }

        if ($audienceType === NotificationBroadcastAudience::SelectedUsers) {
            $userIds = is_array($audienceFilter['user_ids'] ?? null) ? $audienceFilter['user_ids'] : [];

            if ($userIds === []) {
                throw new InvalidArgumentException('Selected users audience requires audience_filter.user_ids.');
            }
        }
    }
}
