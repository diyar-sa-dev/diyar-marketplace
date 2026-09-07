<?php

namespace App\Services\Returns;

use App\Models\ReturnEvidence;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;

final class ReturnEvidenceService
{
    private const MAX_FILES = 5;

    public function __construct(
        private readonly MediaUploadService $media,
    ) {}

    public function store(User $user, ReturnRequest $returnRequest, UploadedFile $file): ReturnEvidence
    {
        if ($returnRequest->user_id !== $user->id) {
            throw new InvalidArgumentException(__('diyar.auth.forbidden'));
        }

        if ($returnRequest->evidence()->count() >= self::MAX_FILES) {
            throw new InvalidArgumentException(__('diyar.returns.evidence_limit_reached'));
        }

        $stored = $this->media->storeAttachment(
            sprintf('returns/%s', $returnRequest->id),
            $file,
            'default',
        );

        return ReturnEvidence::query()->create([
            'return_request_id' => $returnRequest->id,
            'uploaded_by' => $user->id,
            'disk' => $this->media->diskName(),
            'path' => $stored->path,
            'original_name' => (string) $file->getClientOriginalName(),
            'mime_type' => $stored->mimeType,
            'size_bytes' => $stored->sizeBytes,
        ]);
    }
}
