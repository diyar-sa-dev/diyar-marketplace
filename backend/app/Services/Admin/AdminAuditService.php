<?php

namespace App\Services\Admin;

use App\Models\AdminAuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Str;

final class AdminAuditService
{
    /** @var list<string> */
    private const SENSITIVE_KEYS = [
        'password',
        'token',
        'otp',
        'secret',
        'card',
        'cvv',
        'api_key',
        'authorization',
        'remember_token',
    ];

    /**
     * @param  array<string, mixed>|null  $before
     * @param  array<string, mixed>|null  $after
     */
    public function record(
        User $actor,
        string $action,
        ?Model $resource = null,
        ?array $before = null,
        ?array $after = null,
        ?string $reason = null,
    ): AdminAuditLog {
        return AdminAuditLog::query()->create([
            'id' => (string) Str::uuid(),
            'actor_id' => $actor->id,
            'actor_role' => $actor->roles->first()?->name?->value,
            'action' => $action,
            'resource_type' => $resource !== null ? $resource::class : null,
            'resource_id' => $resource?->getKey(),
            'before' => $this->redact($before),
            'after' => $this->redact($after),
            'reason' => $reason,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'request_id' => Request::header('X-Request-Id') ?? Request::header('X-Correlation-Id'),
            'created_at' => now(),
        ]);
    }

    /**
     * @param  array<string, mixed>|null  $payload
     * @return array<string, mixed>|null
     */
    private function redact(?array $payload): ?array
    {
        if ($payload === null) {
            return null;
        }

        return Arr::map($payload, function (mixed $value, string $key): mixed {
            if ($this->isSensitiveKey($key)) {
                return '[REDACTED]';
            }

            if (is_array($value)) {
                return $this->redact($value);
            }

            return $value;
        });
    }

    private function isSensitiveKey(string $key): bool
    {
        $normalized = Str::lower($key);

        foreach (self::SENSITIVE_KEYS as $needle) {
            if (Str::contains($normalized, $needle)) {
                return true;
            }
        }

        return false;
    }
}
