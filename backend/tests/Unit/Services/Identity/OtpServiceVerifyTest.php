<?php

namespace Tests\Unit\Services\Identity;

use App\Enums\OtpPurpose;
use App\Services\Identity\OtpService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class OtpServiceVerifyTest extends TestCase
{
    use RefreshDatabase;

    public function test_verify_consumes_otp_and_rejects_replay(): void
    {
        config(['diyar.otp.test_mode' => true, 'diyar.otp.test_code' => '123456']);

        $otp = app(OtpService::class);
        $phone = '966501111111';

        $otp->issue($phone, OtpPurpose::Registration);

        $otp->verify($phone, OtpPurpose::Registration, '123456');

        $this->expectException(ValidationException::class);
        $otp->verify($phone, OtpPurpose::Registration, '123456');
    }
}
