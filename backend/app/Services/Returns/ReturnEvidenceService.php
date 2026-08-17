<?php

namespace App\Services\Returns;

use App\Models\ReturnEvidence;
use App\Models\ReturnRequest;
use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use RuntimeException;

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

        $this->media->validateImage($file);

        $disk = $this->media->diskName();
        $directory = sprintf('returns/%s', $returnRequest->id);
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = $directory.'/'.$filename;

        $stored = Storage::disk($disk)->putFileAs($directory, $file, $filename);
        if ($stored === false) {
            throw new RuntimeException(__('diyar.media.upload_failed'));
        }

        return ReturnEvidence::query()->create([
            'return_request_id' => $returnRequest->id,
            'uploaded_by' => $user->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => (string) $file->getClientOriginalName(),
            'mime_type' => (string) $file->getMimeType(),
            'size_bytes' => (int) $file->getSize(),
        ]);
    }
}
