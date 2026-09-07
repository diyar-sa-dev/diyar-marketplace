<?php

namespace App\Services\Chat;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;

final class ChatAttachmentService
{
    public function __construct(
        private readonly MediaUploadService $mediaUpload,
    ) {}

    public function attachToMessage(Message $message, UploadedFile $file): MessageAttachment
    {
        $stored = $this->mediaUpload->storeAttachment(
            'chat/'.$message->conversation_id,
            $file,
            'default',
        );

        return MessageAttachment::query()->create([
            'message_id' => $message->id,
            'disk' => $this->mediaUpload->diskName(),
            'path' => $stored->path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => $stored->mimeType,
            'size_bytes' => $stored->sizeBytes,
        ]);
    }
}
