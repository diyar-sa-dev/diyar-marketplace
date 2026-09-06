<?php

namespace App\Services\Infrastructure;

use Illuminate\Support\Str;

final class EnvironmentSafetyValidator
{
    /**
     * @return list<string>
     */
    public function violations(): array
    {
        $env = app()->environment();
        $violations = [];

        if ($env === 'production') {
            $violations = array_merge($violations, $this->productionViolations());
        }

        if ($env === 'staging') {
            $violations = array_merge($violations, $this->stagingViolations());
        }

        return $violations;
    }

    /**
     * Non-fatal advisory checks (logged in staging deploy smoke).
     *
     * @return list<string>
     */
    public function advisories(): array
    {
        if (! app()->environment('staging')) {
            return [];
        }

        return $this->stagingViolations();
    }

    public function assertSafe(): void
    {
        $violations = $this->violations();

        if ($violations !== []) {
            throw new \RuntimeException(
                'Environment safety check failed: '.implode(' | ', $violations)
            );
        }
    }

    /**
     * @return list<string>
     */
    private function productionViolations(): array
    {
        $issues = [];

        if (config('app.debug')) {
            $issues[] = 'APP_DEBUG must be false in production';
        }

        if (config('diyar.payments.use_fake_gateway')) {
            $issues[] = 'DIYAR_PAYMENT_USE_FAKE_GATEWAY must be false in production';
        }

        if (config('diyar.loadtest.enabled')) {
            $issues[] = 'DIYAR_LOADTEST_MODE must be false in production (disables rate limits and auth throttles)';
        }

        if (filter_var(env('MYFATOORAH_TEST_MODE', true), FILTER_VALIDATE_BOOL)) {
            $issues[] = 'MYFATOORAH_TEST_MODE must be false in production';
        }

        if ($this->looksLikeStagingDatabase()) {
            $issues[] = 'production must not use a staging database name/host pattern';
        }

        return $issues;
    }

    /**
     * @return list<string>
     */
    private function stagingViolations(): array
    {
        $issues = [];

        if (config('app.debug')) {
            $issues[] = 'APP_DEBUG should be false in staging';
        }

        if (! config('diyar.payments.use_fake_gateway')
            && ! filter_var(env('MYFATOORAH_TEST_MODE', true), FILTER_VALIDATE_BOOL)) {
            $issues[] = 'staging requires MYFATOORAH_TEST_MODE=true or DIYAR_PAYMENT_USE_FAKE_GATEWAY=true';
        }

        if (config('diyar.loadtest.enabled')) {
            $issues[] = 'DIYAR_LOADTEST_MODE must be false in staging (use only for local E2E/load tests)';
        }

        if ($this->looksLikeProductionDatabase()) {
            $issues[] = 'staging must not point at production database credentials';
        }

        if ($this->looksLikeProductionRedisPrefix()) {
            $issues[] = 'REDIS_PREFIX must include "staging" to avoid cross-environment cache/queue bleed';
        }

        $mailer = (string) config('mail.default');
        if (in_array($mailer, ['smtp', 'ses', 'postmark', 'resend'], true)
            && ! Str::contains((string) env('MAIL_FROM_NAME', ''), 'STAGING', true)) {
            $issues[] = 'MAIL_FROM_NAME should include [STAGING] when using live mail transports';
        }

        return $issues;
    }

    private function looksLikeProductionDatabase(): bool
    {
        $database = Str::lower((string) config('database.connections.'.config('database.default').'.database'));
        $host = Str::lower((string) config('database.connections.'.config('database.default').'.host'));

        foreach (['diyar_prod', 'diyar_production', 'production'] as $needle) {
            if (Str::contains($database, $needle) || Str::contains($host, $needle)) {
                return true;
            }
        }

        return false;
    }

    private function looksLikeStagingDatabase(): bool
    {
        $database = Str::lower((string) config('database.connections.'.config('database.default').'.database'));

        return Str::contains($database, 'staging');
    }

    private function looksLikeProductionRedisPrefix(): bool
    {
        $prefix = Str::lower((string) config('database.redis.options.prefix', env('REDIS_PREFIX', '')));

        if ($prefix === '') {
            return true;
        }

        return ! Str::contains($prefix, 'staging');
    }
}
