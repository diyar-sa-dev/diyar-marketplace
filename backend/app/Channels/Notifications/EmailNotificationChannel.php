<?php

namespace App\Channels\Notifications;

use App\Contracts\Notifications\NotificationChannelInterface;
use App\Enums\NotificationChannel;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\Mail\DiyarMailContent;
use App\Services\Mail\DiyarPhpMailer;
use App\Services\Notifications\NotificationCircuitBreaker;
use App\Support\User\UserNotificationPreferences;
use RuntimeException;

final class EmailNotificationChannel implements NotificationChannelInterface
{
    public function __construct(
        private readonly DiyarPhpMailer $mailer,
        private readonly DiyarMailContent $mailContent,
        private readonly NotificationCircuitBreaker $circuitBreaker,
    ) {}

    public function channel(): NotificationChannel
    {
        return NotificationChannel::Email;
    }

    public function deliver(
        User $recipient,
        UserNotification $notification,
        NotificationDelivery $delivery,
        array $payload,
    ): void {
        if ($recipient->email === null) {
            throw new RuntimeException('Recipient has no email address.');
        }

        if (! UserNotificationPreferences::emailEnabled($recipient)) {
            throw new RuntimeException('Email notifications are disabled for this user.');
        }

        $this->circuitBreaker->assertAvailable('email');

        $locale = UserNotificationPreferences::mailLocale($recipient);
        $subject = $notification->title;
        $actionUrl = is_string($payload['action_url'] ?? null) ? $payload['action_url'] : null;
        $detailLines = is_array($payload['detail_lines'] ?? null) ? $payload['detail_lines'] : [];

        $body = $this->mailContent->notificationBody(
            $locale,
            $recipient->name,
            $notification->title,
            $notification->body,
            $actionUrl,
            $detailLines,
        );

        $this->mailer->send(
            toEmail: $recipient->email,
            subject: $subject,
            locale: $locale,
            title: $subject,
            bodyHtml: $body,
            strict: true,
        );
    }
}
