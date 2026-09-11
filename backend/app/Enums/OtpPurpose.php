<?php

namespace App\Enums;

enum OtpPurpose: string
{
    case Registration = 'registration';
    case Login = 'login';
    case TwoFactorSetup = 'two_factor_setup';
    case PhoneVerification = 'phone_verification';
    case PasswordRecovery = 'password_recovery';
    case PhoneChange = 'phone_change';
    case EmailVerification = 'email_verification';
}
