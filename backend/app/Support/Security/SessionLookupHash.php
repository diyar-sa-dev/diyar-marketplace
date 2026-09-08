<?php

namespace App\Support\Security;

final class SessionLookupHash
{
    public static function make(string $laravelSessionId): string
    {
        return hash_hmac('sha256', $laravelSessionId, self::key());
    }

    private static function key(): string
    {
        $key = (string) config('app.key');

        if (str_starts_with($key, 'base64:')) {
            $decoded = base64_decode(substr($key, 7), true);

            return is_string($decoded) && $decoded !== '' ? $decoded : $key;
        }

        return $key;
    }
}
