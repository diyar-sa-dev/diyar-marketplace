<?php

namespace App\Contracts\Sms;

interface SmsProvider
{
    /**
     * Send an SMS message to a normalized phone number (E.164 without +).
     *
     * @param  string  $phone  e.g. 966501234567
     * @param  string  $message  Message body (must not be logged if it contains OTP in production logs)
     */
    public function send(string $phone, string $message): void;
}
