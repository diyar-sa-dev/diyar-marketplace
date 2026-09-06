<?php

namespace App\Support\Realtime;

final class ReverbAllowedOrigins
{
    /**
     * @param  list<string|null>  $origins
     * @return list<string>
     */
    public static function resolve(string $appEnv, array $origins): array
    {
        if ($appEnv !== 'production') {
            return ['*'];
        }

        return array_values(array_unique(array_filter(array_map(
            static fn (?string $origin): string => trim((string) $origin),
            $origins,
        ), static fn (string $origin): bool => $origin !== '')));
    }
}
