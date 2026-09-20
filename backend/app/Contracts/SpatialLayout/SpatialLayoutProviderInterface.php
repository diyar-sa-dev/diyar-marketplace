<?php

namespace App\Contracts\SpatialLayout;

/**
 * Produces untrusted layout command payloads — client must validate via spatial engine.
 *
 * @param  array<string, mixed>  $document  Room design document (schema v1)
 * @return array<int, array<string, mixed>>
 */
interface SpatialLayoutProviderInterface
{
    /**
     * @param  array<string, mixed>  $document
     * @return array<int, array<string, mixed>>
     */
    public function suggest(array $document, ?string $intent = null): array;
}
