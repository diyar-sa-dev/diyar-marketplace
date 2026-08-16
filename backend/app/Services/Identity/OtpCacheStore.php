<?php

namespace App\Services\Identity;

use App\Enums\OtpPurpose;
use Illuminate\Support\Facades\Cache;

/**
 * Cache-backed OTP state store. OTP plaintext is never persisted.
 */
final class OtpCacheStore
{
    public function key(string $phone, OtpPurpose $purpose): string
    {
        return sprintf('diyar:otp:%s:%s', $purpose->value, $phone);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function put(string $phone, OtpPurpose $purpose, array $payload, int $ttlSeconds): void
    {
        Cache::put($this->key($phone, $purpose), $payload, $ttlSeconds);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $phone, OtpPurpose $purpose): ?array
    {
        $value = Cache::get($this->key($phone, $purpose));

        return is_array($value) ? $value : null;
    }

    public function forget(string $phone, OtpPurpose $purpose): void
    {
        Cache::forget($this->key($phone, $purpose));
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(string $phone, OtpPurpose $purpose, array $payload, int $ttlSeconds): void
    {
        $this->put($phone, $purpose, $payload, $ttlSeconds);
    }
}
