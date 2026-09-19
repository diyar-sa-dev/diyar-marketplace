<?php

namespace App\Services\Visualization;

final class VisualizationResult
{
    /**
     * @param  array<string, mixed>  $payload
     */
    private function __construct(
        public readonly bool $success,
        public readonly array $payload,
        public readonly ?string $failureCode,
        public readonly ?string $providerKey,
    ) {}

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function succeeded(array $payload, string $providerKey): self
    {
        return new self(true, $payload, null, $providerKey);
    }

    public static function failed(string $failureCode, ?string $providerKey = null): self
    {
        return new self(false, [], $failureCode, $providerKey);
    }
}
