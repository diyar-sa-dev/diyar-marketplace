<?php

namespace Tests\Unit\Support\Identity;

use App\Contracts\Identity\OtpCodeGenerator;
use App\Support\Identity\OtpTestCodeResolver;
use Tests\TestCase;

class OtpTestCodeResolverTest extends TestCase
{
    public function test_test_code_is_used_only_in_local_testing_with_test_mode(): void
    {
        app()->detectEnvironment(fn () => 'testing');
        config(['diyar.otp.test_mode' => true, 'diyar.otp.test_code' => '123456']);

        $generator = $this->createMock(OtpCodeGenerator::class);
        $generator->expects($this->never())->method('generate');

        $this->assertSame('123456', OtpTestCodeResolver::resolve(6, $generator));
    }

    public function test_production_environment_never_enables_test_mode(): void
    {
        app()->detectEnvironment(fn () => 'production');
        config(['diyar.otp.test_mode' => true, 'diyar.otp.test_code' => '123456']);

        $generator = $this->createMock(OtpCodeGenerator::class);
        $generator->expects($this->once())->method('generate')->with(6)->willReturn('654321');

        $this->assertSame('654321', OtpTestCodeResolver::resolve(6, $generator));
        $this->assertFalse(OtpTestCodeResolver::testModeEnabled());
    }

    public function test_staging_environment_never_enables_test_mode(): void
    {
        app()->detectEnvironment(fn () => 'staging');
        config(['diyar.otp.test_mode' => true, 'diyar.otp.test_code' => '123456']);

        $generator = $this->createMock(OtpCodeGenerator::class);
        $generator->expects($this->once())->method('generate')->with(6)->willReturn('111222');

        $this->assertSame('111222', OtpTestCodeResolver::resolve(6, $generator));
        $this->assertFalse(OtpTestCodeResolver::testModeEnabled());
    }

    public function test_force_random_skips_test_code_even_in_testing(): void
    {
        app()->detectEnvironment(fn () => 'testing');
        config(['diyar.otp.test_mode' => true, 'diyar.otp.test_code' => '123456']);

        $generator = $this->createMock(OtpCodeGenerator::class);
        $generator->expects($this->once())->method('generate')->with(6)->willReturn('999888');

        $this->assertSame('999888', OtpTestCodeResolver::resolve(6, $generator, forceRandom: true));
    }

    public function test_test_code_or_null_returns_configured_code_in_test_mode(): void
    {
        app()->detectEnvironment(fn () => 'testing');
        config(['diyar.otp.test_mode' => true, 'diyar.otp.test_code' => '123456']);

        $this->assertSame('123456', OtpTestCodeResolver::testCodeOrNull(6));
    }

    public function test_test_code_or_null_returns_null_when_test_mode_disabled(): void
    {
        app()->detectEnvironment(fn () => 'testing');
        config(['diyar.otp.test_mode' => false, 'diyar.otp.test_code' => '123456']);

        $this->assertNull(OtpTestCodeResolver::testCodeOrNull(6));
    }
}
