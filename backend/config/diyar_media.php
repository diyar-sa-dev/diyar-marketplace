<?php

return [
    'disk' => env('DIYAR_MEDIA_DISK', 'media'),
    'max_upload_kb' => (int) env('DIYAR_MEDIA_MAX_UPLOAD_KB', 5120),
    'allowed_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
    'allowed_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    'avatar_directory' => 'users',
    'vendor_logo_max_kb' => (int) env('DIYAR_VENDOR_LOGO_MAX_KB', 2048),
    'vendor_logo_mimes' => ['image/jpeg', 'image/png', 'image/svg+xml'],
    'vendor_logo_extensions' => ['jpg', 'jpeg', 'png', 'svg'],
    'vendor_cover_max_kb' => (int) env('DIYAR_VENDOR_COVER_MAX_KB', 5120),
    'vendor_cover_mimes' => ['image/jpeg', 'image/png', 'image/webp'],
    'vendor_cover_extensions' => ['jpg', 'jpeg', 'png', 'webp'],
    'vendor_directory' => 'vendors',
    'cms_directories' => [
        'blog_hero' => 'cms/blog/hero',
        'blog_avatar' => 'cms/blog/avatar',
        'project_cover' => 'cms/projects/cover',
        'project_gallery' => 'cms/projects/gallery',
        'b2b_logo' => 'cms/b2b/logo',
        'b2b_portfolio' => 'cms/b2b/portfolio',
    ],
    'default_cms_directory' => 'cms/misc',
    'optimization' => [
        'enabled' => filter_var(env('DIYAR_MEDIA_OPTIMIZE', true), FILTER_VALIDATE_BOOL),
        'webp_quality' => (int) env('DIYAR_MEDIA_WEBP_QUALITY', 82),
        'profiles' => [
            'avatar' => [
                'max_width' => 512,
                'max_height' => 512,
            ],
            'cover' => [
                'max_width' => 1920,
                'max_height' => 1080,
            ],
            'product' => [
                'max_width' => 2000,
                'max_height' => 2000,
            ],
            'default' => [
                'max_width' => 2400,
                'max_height' => 2400,
            ],
        ],
        'pdf' => [
            'enabled' => filter_var(env('DIYAR_MEDIA_OPTIMIZE_PDF', true), FILTER_VALIDATE_BOOL),
            'ghostscript_quality' => env('DIYAR_MEDIA_PDF_QUALITY', '/ebook'),
        ],
    ],
];
