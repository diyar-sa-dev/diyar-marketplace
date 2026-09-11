<?php

namespace Tests\Unit\Services\Identity;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Enums\OtpPurpose;
use App\Infrastructure\Sms\LogSmsProvider;
use App\Services\Identity\OtpCacheStore;
use App\Services\Identity\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OtpServiceDualCodeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        LogSmsProvider::flush();
        config([
            'diyar.otp.test_mode' => true,
            'diyar.otp.test_code' => '123456',
            'diyar.sms.driver' => 'log',
        ]);
    }

    public function test_sms_code_is_generated_and_test_code_is_also_accepted(): void
    {
        $this->mock(OtpCodeGenerator::class, function ($mock): void {
            $mock->shouldReceive('generate')->once()->with(6)->andReturn('654321');
        });

        $phone = '966501111111';
        app(OtpService::class)->issue($phone, OtpPurpose::TwoFactorSetup);

        $devOtp = LogSmsProvider::lastDevelopmentOtp();
        $this->assertSame('654321', $devOtp['otp'] ?? null);

        $cache = app(OtpCacheStore::class)->get($phone, OtpPurpose::TwoFactorSetup);
        $this->assertNotNull($cache);
        $this->assertTrue(Hash::check('654321', (string) $cache['code_hash']));
        $this->assertTrue(Hash::check('123456', (string) $cache['test_code_hash']));

        app(OtpService::class)->verify($phone, OtpPurpose::TwoFactorSetup, '123456');
    }

    public function test_sms_message_contains_generated_code_not_test_code(): void
    {
        $this->mock(OtpCodeGenerator::class, function ($mock): void {
            $mock->shouldReceive('generate')->once()->with(6)->andReturn('654321');
        });

        app(OtpService::class)->issue('966502222222', OtpPurpose::Login);

        $message = LogSmsProvider::lastMessage();
        $this->assertNotNull($message);
        $this->assertStringContainsString('654321', $message);
        $this->assertStringNotContainsString('123456', $message);
    }
}
