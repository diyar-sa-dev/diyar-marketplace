<?php

namespace App\Support\Media;

use App\Services\Media\MediaUploadService;

final class CmsImageUrl
{
    public static function resolve(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $value) === 1) {
            return $value;
        }

        return app(MediaUploadService::class)->url($value);
    }
}
