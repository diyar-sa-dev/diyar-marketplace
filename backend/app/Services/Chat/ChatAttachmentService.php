<?php

namespace App\Services\Chat;

use App\Models\Message;
use App\Models\MessageAttachment;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class ChatAttachmentService
{
    public function __construct(
        private readonly MediaUploadService $mediaUpload,
    ) {}

    public function attachToMessage(Message $message, UploadedFile $file): MessageAttachment
    {
        $this->mediaUpload->validateImage($file);

        $disk = $this->mediaUpload->diskName();
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $filename = Str::uuid()->toString().'.'.$extension;
        $path = 'chat/'.$message->conversation_id.'/'.$filename;

        Storage::disk($disk)->putFileAs(
            'chat/'.$message->conversation_id,
            $file,
            $filename,
        );

        return MessageAttachment::query()->create([
            'message_id' => $message->id,
            'disk' => $disk,
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => (string) $file->getMimeType(),
            'size_bytes' => (int) $file->getSize(),
        ]);
    }
}
