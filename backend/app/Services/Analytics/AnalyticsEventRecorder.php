<?php

namespace App\Services\Analytics;

use App\Enums\AnalyticsEventType;
use App\Models\AnalyticsEvent;
use App\Models\User;
use Illuminate\Support\Str;

final class AnalyticsEventRecorder
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function record(
        AnalyticsEventType $type,
        ?User $user = null,
        ?string $sessionId = null,
        ?string $subjectType = null,
        ?string $subjectId = null,
        ?string $vendorAccountId = null,
        ?string $providerAccountId = null,
        array $payload = [],
    ): void {
        if (! config('diyar.analytics.events_enabled', true)) {
            return;
        }

        AnalyticsEvent::query()->create([
            'event_type' => $type->value,
            'subject_type' => $subjectType,
            'subject_id' => $subjectId,
            'user_id' => $user?->id,
            'session_id' => $sessionId !== null ? Str::limit($sessionId, 64, '') : null,
            'vendor_account_id' => $vendorAccountId,
            'provider_account_id' => $providerAccountId,
            'payload' => $this->sanitizePayload($payload),
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function sanitizePayload(array $payload): array
    {
        unset($payload['card'], $payload['cvv'], $payload['email'], $payload['phone']);

        return $payload;
    }
}
