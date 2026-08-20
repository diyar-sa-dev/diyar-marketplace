<?php

namespace App\Services\Notifications;

use App\Enums\NotificationChannel;
use App\Enums\NotificationPriority;
use App\Enums\NotificationType;

final class NotificationCatalog
{
    public function __construct(
        private readonly NotificationCategoryRegistry $registry,
    ) {}

    /**
     * @return list<NotificationChannel>
     */
    public function channelsFor(NotificationType $type): array
    {
        return match ($type) {
            NotificationType::AuthOtp => [NotificationChannel::Email],
            NotificationType::AuthRegistration => [
                NotificationChannel::InApp,
                NotificationChannel::Email,
            ],
            NotificationType::PaymentFailed => [
                NotificationChannel::InApp,
                NotificationChannel::Email,
                NotificationChannel::Push,
            ],
            NotificationType::SystemAlert => [
                NotificationChannel::InApp,
                NotificationChannel::Email,
                NotificationChannel::Push,
            ],
            default => [
                NotificationChannel::InApp,
                NotificationChannel::Email,
                NotificationChannel::Push,
            ],
        };
    }

    public function priorityFor(NotificationType $type): NotificationPriority
    {
        return match ($type) {
            NotificationType::AuthOtp,
            NotificationType::PaymentFailed,
            NotificationType::SystemAlert => NotificationPriority::High,
            default => NotificationPriority::Normal,
        };
    }

    public function preferenceCategory(NotificationType $type): string
    {
        return $this->registry->categoryForType($type);
    }

    public function overridesPreferences(NotificationType $type): bool
    {
        return in_array($type, [
            NotificationType::AuthOtp,
            NotificationType::PaymentFailed,
            NotificationType::SystemAlert,
        ], true);
    }
}
