<?php

namespace App\Services\Security;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

final class TwoFactorChallengeStore
{
    public function create(string $userId, bool $remember): string
    {
        $ttlMinutes = (int) config('diyar.two_factor.login_challenge_ttl_minutes', 15);
        $ttlSeconds = $ttlMinutes * 60;

        $previousChallengeId = Cache::get($this->userIndexKey($userId));
        if (is_string($previousChallengeId) && $previousChallengeId !== '') {
            Cache::forget($this->key($previousChallengeId));
        }

        $challengeId = (string) Str::uuid();

        Cache::put($this->key($challengeId), [
            'user_id' => $userId,
            'remember' => $remember,
            'created_at' => now()->timestamp,
        ], $ttlSeconds);

        Cache::put($this->userIndexKey($userId), $challengeId, $ttlSeconds);

        return $challengeId;
    }

    /**
     * @return array{user_id: string, remember: bool, created_at: int}|null
     */
    public function peek(string $challengeId): ?array
    {
        $value = Cache::get($this->key($challengeId));

        return is_array($value) ? $value : null;
    }

    /**
     * @return array{user_id: string, remember: bool, created_at: int}|null
     */
    public function consume(string $challengeId): ?array
    {
        $lock = Cache::lock($this->key($challengeId).':consume', 10);

        try {
            $lock->block(5);
            $value = Cache::pull($this->key($challengeId));

            if (is_array($value)) {
                Cache::forget($this->userIndexKey((string) $value['user_id']));

                return $value;
            }

            return null;
        } finally {
            optional($lock)->release();
        }
    }

    private function key(string $challengeId): string
    {
        return 'diyar:2fa:login-challenge:'.$challengeId;
    }

    private function userIndexKey(string $userId): string
    {
        return 'diyar:2fa:login-challenge:user:'.$userId;
    }
}
