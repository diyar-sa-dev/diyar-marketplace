<?php

namespace App\Services\Notifications;

use App\Enums\NotificationType;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Carbon;

final class NotificationAggregationService
{
    /**
     * @param  array<string, mixed>  $payload
     * @return array{0: ?UserNotification, 1: bool} same shape as persist result — updated existing vs new
     */
    public function aggregateExisting(
        User $recipient,
        NotificationType $type,
        array $payload,
        ?string $entityType,
        ?string $entityId,
        string $renderedTitle,
        string $renderedBody,
    ): array {
        if (! $this->isAggregatable($type)) {
            return [null, false];
        }

        $groupKey = $this->groupKey($type, $entityType, $entityId);
        if ($groupKey === null) {
            return [null, false];
        }

        $windowHours = (int) config('diyar.notifications.aggregation.window_hours', 24);
        $since = Carbon::now()->subHours($windowHours);

        $existing = UserNotification::query()
            ->where('user_id', $recipient->id)
            ->where('group_key', $groupKey)
            ->whereNull('read_at')
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->first();

        if ($existing === null) {
            return [null, false];
        }

        $actorName = trim((string) ($payload['actor_name'] ?? $payload['reviewer_name'] ?? $payload['customer_name'] ?? ''));
        $actors = is_array($existing->actor_snapshot) ? $existing->actor_snapshot : [];
        if ($actorName !== '' && ! in_array($actorName, $actors, true)) {
            array_unshift($actors, $actorName);
        }
        $actors = array_slice(array_values(array_unique($actors)), 0, 5);

        $count = $existing->aggregated_count + 1;
        $title = $this->renderAggregatedTitle($type, $actors, $count, $payload);
        $body = $this->renderAggregatedBody($type, $actors, $count, $payload, $renderedBody);

        $existing->update([
            'title' => $title,
            'body' => $body,
            'aggregated_count' => $count,
            'actor_snapshot' => $actors,
            'data' => array_merge($existing->data ?? [], $payload, [
                'aggregated_count' => $count,
                'latest_actor' => $actors[0] ?? null,
            ]),
        ]);

        return [$existing->fresh(), false];
    }

    public function groupKey(NotificationType $type, ?string $entityType, ?string $entityId): ?string
    {
        if (! $this->isAggregatable($type)) {
            return null;
        }

        if ($entityType === null || $entityId === null || $entityId === '') {
            return null;
        }

        return "{$type->value}:{$entityType}:{$entityId}";
    }

    public function isAggregatable(NotificationType $type): bool
    {
        $types = config('diyar.notifications.aggregation.types', []);

        return in_array($type->value, $types, true);
    }

    /**
     * @param  list<string>  $actors
     * @param  array<string, mixed>  $payload
     */
    private function renderAggregatedTitle(
        NotificationType $type,
        array $actors,
        int $count,
        array $payload,
    ): string {
        $primary = $actors[0] ?? __('diyar.notifications.aggregation.someone');
        $others = max(0, $count - 1);

        return match ($type) {
            NotificationType::ReviewCreated => $others > 0
                ? __('diyar.notifications.aggregation.reviews_title', ['name' => $primary, 'count' => $others])
                : __('diyar.notifications.review_created.title', [
                    'product_name' => $payload['product_name'] ?? '—',
                    'rating' => $payload['rating'] ?? '—',
                    'reviewer_name' => $primary,
                    'store_name' => $payload['store_name'] ?? '—',
                ]),
            default => $others > 0
                ? __('diyar.notifications.aggregation.generic_title', ['name' => $primary, 'count' => $others])
                : $primary,
        };
    }

    /**
     * @param  list<string>  $actors
     * @param  array<string, mixed>  $payload
     */
    private function renderAggregatedBody(
        NotificationType $type,
        array $actors,
        int $count,
        array $payload,
        string $fallbackBody,
    ): string {
        if ($count <= 1) {
            return $fallbackBody;
        }

        return match ($type) {
            NotificationType::ReviewCreated => __('diyar.notifications.aggregation.reviews_body', [
                'product_name' => $payload['product_name'] ?? '—',
                'count' => $count,
            ]),
            default => $fallbackBody,
        };
    }
}
