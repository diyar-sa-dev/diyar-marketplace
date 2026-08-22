<?php

namespace App\Http\Resources;

use App\Models\ReturnEvidence;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin ReturnEvidence */
class ReturnEvidenceResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $canView = $request->user('web') !== null;

        return [
            'id' => $this->id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'url' => $canView ? $this->resolveUrl() : null,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }

    private function resolveUrl(): ?string
    {
        if ($this->disk === app(MediaUploadService::class)->diskName()) {
            return app(MediaUploadService::class)->url($this->path);
        }

        return Storage::disk($this->disk)->url($this->path);
    }
}
