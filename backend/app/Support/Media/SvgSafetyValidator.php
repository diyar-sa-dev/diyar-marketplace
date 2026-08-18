<?php

namespace App\Support\Media;

use InvalidArgumentException;

final class SvgSafetyValidator
{
    public static function assertSafe(string $contents): void
    {
        $normalized = strtolower($contents);

        if (preg_match('/<\s*script\b/', $normalized)) {
            throw new InvalidArgumentException(__('diyar.media.unsafe_svg'));
        }

        if (preg_match('/\bon[a-z]+\s*=/', $normalized)) {
            throw new InvalidArgumentException(__('diyar.media.unsafe_svg'));
        }

        if (preg_match('/(javascript:|data:text\/html)/', $normalized)) {
            throw new InvalidArgumentException(__('diyar.media.unsafe_svg'));
        }
    }
}
