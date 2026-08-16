<?php

namespace App\Enums;

enum OtpPurpose: string
{
    case Registration = 'registration';
    case Login = 'login';
    case PhoneVerification = 'phone_verification';
    case PasswordRecovery = 'password_recovery';
}
