<?php

namespace App\Channels\Notifications;

use App\Contracts\Notifications\NotificationChannelInterface;
use App\Contracts\Notifications\PushProviderInterface;
use App\Enums\NotificationChannel;
use App\Infrastructure\Notifications\PushProviderException;
use App\Models\NotificationDelivery;
use App\Models\NotificationDevice;
use App\Models\User;
use App\Models\UserNotification;
use App\Services\Notifications\NotificationCircuitBreaker;
use App\Services\Notifications\NotificationDeviceService;
use RuntimeException;

final class PushNotificationChannel implements NotificationChannelInterface
{
    public function __construct(
        private readonly PushProviderInterface $pushProvider,
        private readonly NotificationCircuitBreaker $circuitBreaker,
        private readonly NotificationDeviceService $devices,
    ) {}

    public function channel(): NotificationChannel
    {
        return NotificationChannel::Push;
    }

    public function deliver(
        User $recipient,
        UserNotification $notification,
        NotificationDelivery $delivery,
        array $payload,
    ): void {
        if ($this->circuitBreaker->isOpen('push')) {
            throw new RuntimeException('Push circuit breaker is open.');
        }

        $devices = NotificationDevice::query()
            ->where('user_id', $recipient->id)
            ->where('active', true)
            ->get()
            ->all();

        if ($devices === []) {
            throw new RuntimeException('No active push devices.');
        }

        try {
            $result = $this->pushProvider->send($recipient, $notification, $devices, $payload);

            if ($result->invalidDeviceIds !== []) {
                $this->devices->deactivateByIds($recipient, $result->invalidDeviceIds);
            }

            $this->circuitBreaker->recordSuccess('push');
        } catch (PushProviderException $exception) {
            $this->circuitBreaker->recordFailure('push');

            if ($exception->permanent) {
                throw new RuntimeException($exception->getMessage(), previous: $exception);
            }

            throw $exception;
        } catch (\Throwable $exception) {
            $this->circuitBreaker->recordFailure('push');
            throw $exception;
        }
    }
}
