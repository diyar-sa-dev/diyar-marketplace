<?php

namespace App\Services\Payments;

use App\Enums\PaymentAttemptStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentWebhookProcessingStatus;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;

final class PaymentHealthService
{
    /**
     * @return array<string, mixed>
     */
    public function snapshot(): array
    {
        $stuckSubmitted = Payment::query()
            ->whereIn('status', [
                PaymentStatus::Pending->value,
                PaymentStatus::Processing->value,
                PaymentStatus::Unknown->value,
            ])
            ->whereHas('attempts', fn ($query) => $query
                ->where('status', PaymentAttemptStatus::Submitted->value)
                ->where('updated_at', '<=', now()->subMinutes(30)))
            ->count();

        $pendingWebhooks = PaymentWebhookEvent::query()
            ->where('processing_status', PaymentWebhookProcessingStatus::Pending->value)
            ->count();

        $failedWebhooks = PaymentWebhookEvent::query()
            ->where('processing_status', PaymentWebhookProcessingStatus::Failed->value)
            ->where('created_at', '>=', now()->subDay())
            ->count();

        $unknownPayments = Payment::query()
            ->where('status', PaymentStatus::Unknown->value)
            ->count();

        $provider = config('diyar.payments.use_fake_gateway') ? 'fake' : config('diyar.payments.gateway');

        return [
            'provider' => $provider,
            'fake_gateway' => (bool) config('diyar.payments.use_fake_gateway'),
            'stuck_submitted_payments' => $stuckSubmitted,
            'pending_webhook_events' => $pendingWebhooks,
            'failed_webhook_events_24h' => $failedWebhooks,
            'unknown_payments' => $unknownPayments,
            'status' => $this->deriveStatus($stuckSubmitted, $pendingWebhooks, $unknownPayments),
        ];
    }

    private function deriveStatus(int $stuckSubmitted, int $pendingWebhooks, int $unknownPayments): string
    {
        if ($stuckSubmitted > 50 || $unknownPayments > 25) {
            return 'degraded';
        }

        if ($pendingWebhooks > 200) {
            return 'degraded';
        }

        return 'ok';
    }
}
