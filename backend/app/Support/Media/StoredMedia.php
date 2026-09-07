<?php

namespace App\Support\Media;

final readonly class StoredMedia
{
    public function __construct(
        public string $path,
        public string $mimeType,
        public int $sizeBytes,
        public string $extension,
    ) {}
}
