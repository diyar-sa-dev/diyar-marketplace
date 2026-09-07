<?php

namespace App\Services\ServiceMarketplace;

use App\Models\ServiceRequest;
use App\Models\ServiceRequestAttachment;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

final class ServiceRequestAttachmentService
{
    private const MAX_FILES = 5;

    /** @var list<string> */
    private const ALLOWED_MIMES = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];

    /** @var list<string> */
    private const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];

    public function __construct(
        private readonly MediaUploadService $media,
    ) {}

    public function store(User $user, ServiceRequest $serviceRequest, UploadedFile $file): ServiceRequestAttachment
    {
        if ($serviceRequest->user_id !== $user->id) {
            throw new InvalidArgumentException(__('diyar.auth.forbidden'));
        }

        if ($serviceRequest->attachments()->count() >= self::MAX_FILES) {
            throw new InvalidArgumentException(__('diyar.services.requests.attachment_limit_reached'));
        }

        $this->validateAttachment($file);

        $stored = $this->media->storeAttachment(
            sprintf('service-requests/%s', $serviceRequest->id),
            $file,
            'default',
        );

        return ServiceRequestAttachment::query()->create([
            'service_request_id' => $serviceRequest->id,
            'uploaded_by' => $user->id,
            'disk' => $this->media->diskName(),
            'path' => $stored->path,
            'original_name' => (string) $file->getClientOriginalName(),
            'mime_type' => $stored->mimeType,
            'size_bytes' => $stored->sizeBytes,
        ]);
    }

    private function validateAttachment(UploadedFile $file): void
    {
        $maxKb = (int) config('diyar_media.max_upload_kb', 10240);
        if ((int) $file->getSize() > $maxKb * 1024) {
            throw new InvalidArgumentException(__('diyar.media.file_too_large'));
        }

        $detectedMime = (string) $file->getMimeType();
        if (! in_array($detectedMime, self::ALLOWED_MIMES, true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_type'));
        }

        $extension = strtolower((string) $file->getClientOriginalExtension());
        if (! in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new InvalidArgumentException(__('diyar.media.invalid_extension'));
        }
    }
}
