<?php

namespace App\Http\Resources;

use App\Models\ServiceRequestAttachment;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServiceRequestAttachment */
class ServiceRequestAttachmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'original_name' => $this->original_name,
            'mime_type' => $this->mime_type,
            'size_bytes' => $this->size_bytes,
            'url' => $media->url($this->path),
        ];
    }
}
