<?php

namespace Tests\Feature\Api\V1\Auth;

use App\Contracts\Sms\SmsProvider;
use App\Enums\OtpPurpose;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Infrastructure\Sms\SmsProviderFactory;
use App\Services\Identity\OtpCacheStore;
use App\Services\Identity\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class SmsProviderTest extends TestCase
{
    use InteractsWithIdentity, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        LogSmsProvider::flush();
    }

    public function test_log_sms_provider_is_bound_in_testing(): void
    {
        $provider = app(SmsProvider::class);
        $this->assertInstanceOf(LogSmsProvider::class, $provider);
    }

    public function test_log_sms_provider_exposes_plain_otp_only_in_testing_mode(): void
    {
        Log::shouldReceive('info')
            ->once()
            ->withArgs(function (string $message, array $context = []) {
                return $message === 'OTP issued for development testing'
                    && ($context['phone'] ?? null) === '966509999999'
                    && ($context['purpose'] ?? null) === OtpPurpose::Registration->value
                    && preg_match('/^\d{6}$/', (string) ($context['otp'] ?? '')) === 1;
            });

        app(OtpService::class)->issue(
            phone: '966509999999',
            purpose: OtpPurpose::Registration,
        );

        $devOtp = LogSmsProvider::lastDevelopmentOtp();

        $this->assertNotNull($devOtp);
        $this->assertSame('966509999999', $devOtp['phone']);
        $this->assertSame(OtpPurpose::Registration->value, $devOtp['purpose']);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $devOtp['otp']);
    }

    public function test_production_environment_never_logs_plain_otp(): void
    {
        Log::shouldReceive('info')->never();

        $this->app->detectEnvironment(fn () => 'production');

        app(OtpService::class)->issue(
            phone: '966508888888',
            purpose: OtpPurpose::PasswordRecovery,
        );

        $this->assertNull(LogSmsProvider::lastDevelopmentOtp());
    }

    public function test_production_environment_name_is_case_insensitive_for_otp_logging(): void
    {
        Log::shouldReceive('info')->never();

        config(['app.env' => 'Production']);

        LogSmsProvider::exposeForDevelopment(
            phone: '966508888888',
            purpose: OtpPurpose::Registration,
            otp: '123456',
        );

        $this->assertNull(LogSmsProvider::lastDevelopmentOtp());
    }

    public function test_production_without_msegat_credentials_fails_fast(): void
    {
        config([
            'app.env' => 'production',
            'services.msegat.username' => null,
            'services.msegat.api_key' => null,
            'services.msegat.sender_id' => null,
        ]);

        $this->expectException(\RuntimeException::class);

        SmsProviderFactory::make();
    }

    public function test_msegat_credentials_disable_plain_otp_logging_even_in_local(): void
    {
        config([
            'services.msegat.username' => 'test-user',
            'services.msegat.api_key' => 'test-key',
            'services.msegat.sender_id' => 'DIYAR',
        ]);

        $this->assertFalse(LogSmsProvider::shouldExposePlainOtp());

        Log::shouldReceive('info')->never();

        LogSmsProvider::exposeForDevelopment(
            phone: '966507777777',
            purpose: OtpPurpose::Registration,
            otp: '123456',
        );

        $this->assertNull(LogSmsProvider::lastDevelopmentOtp());
    }

    public function test_exposed_development_otp_matches_cache_hash_and_verify_flow(): void
    {
        $phone = '966506666666';

        app(OtpService::class)->issue(
            phone: $phone,
            purpose: OtpPurpose::Registration,
        );

        $devOtp = LogSmsProvider::lastDevelopmentOtp();
        $this->assertNotNull($devOtp);

        $cacheState = app(OtpCacheStore::class)->get($phone, OtpPurpose::Registration);
        $this->assertNotNull($cacheState);
        $this->assertTrue(Hash::check($devOtp['otp'], (string) $cacheState['code_hash']));
        $this->assertArrayNotHasKey('otp', $cacheState);

        app(OtpService::class)->verify($phone, OtpPurpose::Registration, $devOtp['otp']);
    }

    public function test_otp_service_uses_sms_provider_without_coupling_to_msegat(): void
    {
        app(OtpService::class)->issue(
            phone: '966509999999',
            purpose: OtpPurpose::PhoneVerification,
        );

        $this->assertNotNull(LogSmsProvider::lastMessage());
        $this->assertStringContainsString('966509999999', LogSmsProvider::$messages[0]['phone']);
    }
}
