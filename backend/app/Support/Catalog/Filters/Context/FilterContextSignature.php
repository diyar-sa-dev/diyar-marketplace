<?php

namespace App\Support\Catalog\Filters\Context;

final class FilterContextSignature
{
    public static function make(FilterContext $context): string
    {
        $payload = self::normalizePayload([
            'content_type' => $context->contentType->value,
            'surface' => $context->surface->value,
            'category' => $context->categorySlug,
            'q' => $context->searchQuery,
            'filters' => self::normalizeFilters($context->activeFilters),
            'locale' => $context->locale,
            'sort' => $context->sort,
        ]);

        return hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public static function normalizeFilters(array $filters): array
    {
        $normalized = [];

        foreach ($filters as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $normalized[(string) $key] = self::normalizeValue($value);
        }

        ksort($normalized);

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private static function normalizePayload(array $payload): array
    {
        $normalized = [];

        foreach ($payload as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $normalized[$key] = self::normalizeValue($value);
        }

        ksort($normalized);

        return $normalized;
    }

    private static function normalizeValue(mixed $value): mixed
    {
        if (is_bool($value)) {
            return $value;
        }

        if (is_int($value) || is_float($value)) {
            return is_float($value) ? round($value, 4) : $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);

            $boolean = filter_var($trimmed, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($boolean !== null && in_array(strtolower($trimmed), ['true', 'false', '1', '0', 'yes', 'no', 'on', 'off'], true)) {
                return $boolean;
            }

            if (is_numeric($trimmed)) {
                return str_contains($trimmed, '.') ? round((float) $trimmed, 4) : (int) $trimmed;
            }

            return $trimmed;
        }

        if (is_array($value)) {
            if (array_is_list($value)) {
                $list = array_map([self::class, 'normalizeValue'], $value);
                sort($list);

                return $list;
            }

            return self::normalizeFilters($value);
        }

        return $value;
    }
}
