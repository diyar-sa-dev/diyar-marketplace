<?php

namespace App\Services\Infrastructure;

/**
 * Validates PHP extensions required for production runtime (Phase 28.14).
 *
 * Financial, shipping, coupon, and loyalty code paths depend on BCMath.
 */
final class PhpRuntimeValidator
{
    /** @var list<string> */
    private const REQUIRED_EXTENSIONS = [
        'bcmath',
        'ctype',
        'curl',
        'dom',
        'fileinfo',
        'json',
        'mbstring',
        'openssl',
        'pdo',
        'pdo_mysql',
        'tokenizer',
        'xml',
        'zip',
    ];

    /** @var list<string> */
    private const RECOMMENDED_EXTENSIONS = [
        'intl',
        'redis',
        'opcache',
    ];

    /**
     * @return list<string>
     */
    public function missingRequired(): array
    {
        $missing = [];

        foreach (self::REQUIRED_EXTENSIONS as $extension) {
            if (! extension_loaded($extension)) {
                $missing[] = $extension;
            }
        }

        return $missing;
    }

    /**
     * @return list<string>
     */
    public function missingRecommended(): array
    {
        $missing = [];

        foreach (self::RECOMMENDED_EXTENSIONS as $extension) {
            if (! extension_loaded($extension)) {
                $missing[] = $extension;
            }
        }

        return $missing;
    }

    /**
     * @return array{
     *     php_version: string,
     *     required: list<string>,
     *     recommended: list<string>,
     *     opcache_enabled: bool,
     *     bcmath_available: bool
     * }
     */
    public function snapshot(): array
    {
        return [
            'php_version' => PHP_VERSION,
            'required' => self::REQUIRED_EXTENSIONS,
            'recommended' => self::RECOMMENDED_EXTENSIONS,
            'opcache_enabled' => function_exists('opcache_get_status')
                && is_array(opcache_get_status(false))
                && (opcache_get_status(false)['opcache_enabled'] ?? false),
            'bcmath_available' => extension_loaded('bcmath'),
        ];
    }

    public function assertProductionReady(): void
    {
        $missing = $this->missingRequired();

        if ($missing !== []) {
            throw new \RuntimeException(
                'Missing required PHP extensions: '.implode(', ', $missing)
            );
        }

        if (! extension_loaded('bcmath')) {
            throw new \RuntimeException(
                'BCMath extension is required for financial calculations (commissions, VAT, payouts).'
            );
        }
    }
}
