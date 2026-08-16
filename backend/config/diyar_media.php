<?php

return [
    'disk' => env('DIYAR_MEDIA_DISK', 'media'),
    'max_upload_kb' => (int) env('DIYAR_MEDIA_MAX_UPLOAD_KB', 5120),
    'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    'avatar_directory' => 'users',
];
