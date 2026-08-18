<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use Illuminate\Support\Facades\Cache;

/**
 * Cache-backed email OTP state store. OTP plaintext is never persisted.
 */
final class EmailOtpCacheStore
{
    public function key(string $email, OtpPurpose $purpose): string
    {
        return sprintf('diyar:email-otp:%s:%s', $purpose->value, strtolower(trim($email)));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function put(string $email, OtpPurpose $purpose, array $payload, int $ttlSeconds): void
    {
        Cache::put($this->key($email, $purpose), $payload, $ttlSeconds);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $email, OtpPurpose $purpose): ?array
    {
        $value = Cache::get($this->key($email, $purpose));

        return is_array($value) ? $value : null;
    }

    public function forget(string $email, OtpPurpose $purpose): void
    {
        Cache::forget($this->key($email, $purpose));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(string $email, OtpPurpose $purpose, array $payload, int $ttlSeconds): void
    {
        $this->put($email, $purpose, $payload, $ttlSeconds);
    }
}
