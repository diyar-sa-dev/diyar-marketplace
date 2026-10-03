<?php

namespace App\Domains\Notifications\Channels;

use App\Domains\Notifications\Contracts\NotificationChannelInterface;
use App\Infrastructure\Sms\Contracts\SmsProvider;
use App\Enums\NotificationChannel;
use App\Models\NotificationDelivery;
use App\Models\User;
use App\Models\UserNotification;
use App\Domains\Notifications\Services\NotificationCircuitBreaker;
use RuntimeException;

final class SmsNotificationChannel implements NotificationChannelInterface
{
    public function __construct(
        private readonly SmsProvider $sms,
        private readonly NotificationCircuitBreaker $circuitBreaker,
    ) {}

    public function channel(): NotificationChannel
    {
        return NotificationChannel::Sms;
    }

    public function deliver(
        User $recipient,
        UserNotification $notification,
        NotificationDelivery $delivery,
        array $payload,
    ): void {
        if (! config('diyar.notifications.sms.enabled', false)) {
            throw new RuntimeException('SMS notifications are not configured.');
        }

        $phone = $recipient->phone ?? null;
        if (! is_string($phone) || trim($phone) === '') {
            throw new RuntimeException('Recipient has no phone number.');
        }

        $this->circuitBreaker->assertAvailable('sms');

        $message = trim($notification->title);
        if ($notification->body !== '') {
            $message .= ': '.$notification->body;
        }

        if (strlen($message) > 320) {
            $message = substr($message, 0, 317).'...';
        }

        $this->sms->send(preg_replace('/\D+/', '', $phone) ?? $phone, $message);
    }
}
