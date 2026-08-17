<?php

namespace App\Services\Returns;

/**
 * Reads frozen policy data from a ReturnRequest snapshot (supports legacy flat snapshots).
 */
final class ReturnPolicySnapshot
{
    /**
     * @param  array<string, mixed>  $snapshot
     * @return array<string, mixed>
     */
    public static function effective(array $snapshot): array
    {
        $effective = $snapshot['effective'] ?? null;

        if (is_array($effective)) {
            return $effective;
        }

        return $snapshot;
    }

    /**
     * @param  array<string, mixed>  $snapshot
     * @return array<string, array<string, mixed>>
     */
    public static function itemPolicies(array $snapshot): array
    {
        $items = $snapshot['items'] ?? [];

        return is_array($items) ? $items : [];
    }

    public static function shippingRefundable(array $snapshot): bool
    {
        return (bool) (self::effective($snapshot)['shipping_refundable'] ?? false);
    }

    public static function requiresEvidence(array $snapshot): bool
    {
        return (bool) (self::effective($snapshot)['requires_evidence'] ?? false);
    }
}
