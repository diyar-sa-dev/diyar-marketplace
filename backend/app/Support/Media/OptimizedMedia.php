<?php

namespace App\Support\Media;

use Illuminate\Http\UploadedFile;

final readonly class OptimizedMedia
{
    public function __construct(
        public string $contents,
        public string $mimeType,
        public string $extension,
        public int $sizeBytes,
    ) {}

    public static function fromUploadedFile(UploadedFile $file): self
    {
        $path = $file->getRealPath();
        $contents = ($path !== false && $path !== '')
            ? (string) file_get_contents($path)
            : (string) $file->get();

        $extension = strtolower((string) $file->getClientOriginalExtension());
        if ($extension === '') {
            $extension = match ((string) $file->getMimeType()) {
                'image/jpeg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/svg+xml' => 'svg',
                'application/pdf' => 'pdf',
                default => 'bin',
            };
        }

        return new self(
            contents: $contents,
            mimeType: (string) $file->getMimeType(),
            extension: $extension,
            sizeBytes: strlen($contents),
        );
    }
}
