<?php

return [
    'required' => 'The :attribute field is required.',
    'email' => 'The :attribute must be a valid email address.',
    'min' => [
        'string' => 'The :attribute must be at least :min characters.',
    ],
    'confirmed' => 'The :attribute confirmation does not match.',
    'digits' => 'The :attribute must be :digits digits.',

    'attributes' => [
        'name' => 'name',
        'phone' => 'phone number',
        'email' => 'email',
        'password' => 'password',
        'password_confirmation' => 'password confirmation',
        'code' => 'verification code',
        'roles' => 'roles',
        'identifier' => 'credentials',
        'credentials' => 'credentials',
    ],
];
