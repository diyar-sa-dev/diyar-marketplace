<?php

return [
    'required' => 'The :attribute field is required.',
    'email' => 'The :attribute must be a valid email address.',
    'min' => [
        'string' => 'The :attribute must be at least :min characters.',
    ],
    'confirmed' => 'The :attribute confirmation does not match.',
    'digits' => 'The :attribute must be :digits digits.',
    'date' => 'The :attribute must be a valid date.',
    'date_format' => 'The :attribute format is invalid.',
    'after_or_equal' => 'The :attribute must be a date after or equal to today.',

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
        'proposed_scheduled_date' => 'proposed scheduled date',
        'proposed_scheduled_time' => 'proposed scheduled time',
        'provider_notes' => 'provider notes',
        'scheduled_date' => 'scheduled date',
        'scheduled_time' => 'scheduled time',
        'expected_available_at' => 'expected availability date',
        'details' => 'details',
        'project_type' => 'project type',
    ],
];
