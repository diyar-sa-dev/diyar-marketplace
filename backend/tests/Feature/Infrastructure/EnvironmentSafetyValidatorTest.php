<?php

namespace Tests\Feature\Infrastructure;

use App\Services\Infrastructure\EnvironmentSafetyValidator;
use Tests\TestCase;

class EnvironmentSafetyValidatorTest extends TestCase
{
    public function test_production_rejects_debug_and_sandbox_payments(): void
    {
        app()->detectEnvironment(fn () => 'production');

        config(['app.debug' => true]);
        config(['diyar.payments.use_fake_gateway' => true]);

        $violations = app(EnvironmentSafetyValidator::class)->violations();

        $this->assertContains('APP_DEBUG must be false in production', $violations);
        $this->assertContains('DIYAR_PAYMENT_USE_FAKE_GATEWAY must be false in production', $violations);
    }

    public function test_production_rejects_loadtest_mode(): void
    {
        app()->detectEnvironment(fn () => 'production');

        config([
            'app.debug' => false,
            'diyar.payments.use_fake_gateway' => false,
            'diyar.loadtest.enabled' => true,
        ]);

        putenv('MYFATOORAH_TEST_MODE=false');

        $violations = app(EnvironmentSafetyValidator::class)->violations();

        $this->assertContains(
            'DIYAR_LOADTEST_MODE must be false in production (disables rate limits and auth throttles)',
            $violations,
        );
    }

    public function test_staging_rejects_loadtest_mode(): void
    {
        app()->detectEnvironment(fn () => 'staging');

        config([
            'app.debug' => false,
            'diyar.payments.use_fake_gateway' => true,
            'diyar.loadtest.enabled' => true,
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => 'diyar_staging',
            'database.redis.options.prefix' => 'diyar-staging-database-',
        ]);

        $violations = app(EnvironmentSafetyValidator::class)->violations();

        $this->assertContains(
            'DIYAR_LOADTEST_MODE must be false in staging (use only for local E2E/load tests)',
            $violations,
        );
    }

    public function test_staging_rejects_production_database_name(): void
    {
        app()->detectEnvironment(fn () => 'staging');

        config([
            'app.debug' => false,
            'diyar.payments.use_fake_gateway' => true,
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => 'diyar_production',
        ]);

        $violations = app(EnvironmentSafetyValidator::class)->violations();

        $this->assertContains('staging must not point at production database credentials', $violations);
    }

    public function test_staging_passes_with_isolated_prefix_and_fake_gateway(): void
    {
        app()->detectEnvironment(fn () => 'staging');

        config([
            'app.debug' => false,
            'diyar.payments.use_fake_gateway' => true,
            'diyar.loadtest.enabled' => false,
            'database.default' => 'sqlite',
            'database.connections.sqlite.database' => 'diyar_staging',
            'database.redis.options.prefix' => 'diyar-staging-database-',
        ]);

        $violations = app(EnvironmentSafetyValidator::class)->violations();

        $this->assertSame([], $violations);
    }
}
