<?php

namespace App\Http\Controllers\Api\V1\Chat;

use App\Http\Controllers\Controller;
use App\Models\MessageAttachment;
use App\Services\Chat\ConversationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttachmentController extends Controller
{
    public function show(
        Request $request,
        string $conversationId,
        string $attachmentId,
        ConversationService $conversations,
    ): StreamedResponse {
        $conversation = $conversations->findForUser($request->user(), $conversationId);

        $attachment = MessageAttachment::query()
            ->where('id', $attachmentId)
            ->whereHas('message', fn ($query) => $query
                ->where('conversation_id', $conversation->id)
                ->whereNull('archived_at')
                ->whereNull('deleted_at'))
            ->firstOrFail();

        if (! Storage::disk($attachment->disk)->exists($attachment->path)) {
            Log::warning('chat.attachment.access_failed', [
                'attachment_id' => $attachment->id,
                'conversation_id' => $conversation->id,
                'user_id' => $request->user()?->id,
            ]);

            abort(404);
        }

        $headers = ['Content-Type' => $attachment->mime_type];

        if ($request->boolean('inline')) {
            $headers['Content-Disposition'] = 'inline; filename="'.addslashes($attachment->original_name).'"';

            return Storage::disk($attachment->disk)->response(
                $attachment->path,
                $attachment->original_name,
                $headers,
            );
        }

        return Storage::disk($attachment->disk)->download(
            $attachment->path,
            $attachment->original_name,
            $headers,
        );
    }
}
