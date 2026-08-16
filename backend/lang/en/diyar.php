<?php

return [
    'otp_message' => 'Your DIYAR verification code is :code. It expires in :minutes minutes.',

    'auth' => [
        'register_success' => 'Registration started successfully. Verify your phone with the OTP sent via SMS.',
        'otp_sent' => 'A verification code has been sent.',
        'otp_verified' => 'Phone verified successfully.',
        'otp_resent' => 'If eligible, a new verification code has been sent.',
        'login_success' => 'Signed in successfully.',
        'phone_verification_required' => 'Verify your phone with the code sent via SMS to continue.',
        'logout_success' => 'Signed out successfully.',
        'password_reset_otp_sent' => 'If an eligible account exists, a verification code has been sent.',
        'password_reset_otp_verified' => 'Code verified. You can set a new password.',
        'password_reset_success' => 'Password reset successfully.',
        'unauthenticated' => 'Unauthenticated.',
        'forbidden' => 'Forbidden.',
        'not_found' => 'Resource not found.',
    ],

    'otp' => [
        'invalid' => 'Invalid verification code.',
        'expired' => 'Verification code has expired.',
        'invalid_request' => 'Invalid or expired verification request.',
        'cooldown' => 'Please wait before requesting a new code.',
        'too_many_resends' => 'Too many resend attempts. Try again later.',
        'too_many_attempts' => 'Too many invalid attempts. Request a new code.',
    ],

    'registration' => [
        'invalid_phone' => 'The phone number format is invalid.',
        'phone_taken' => 'This phone number is already registered.',
        'email_taken' => 'This email address is already registered.',
        'unable_to_register' => 'Unable to complete registration with the provided details.',
        'roles_required' => 'At least one role is required.',
        'invalid_roles' => 'One or more selected roles are invalid.',
    ],

    'errors' => [
        'unexpected' => 'Something went wrong. Please try again.',
    ],
];
