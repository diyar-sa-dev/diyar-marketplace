<?php

namespace App\Http\Controllers\Api\V1\Chat;

use App\Http\Controllers\Controller;
use App\Http\Requests\Chat\ReportMessageRequest;
use App\Http\Requests\Chat\SendMessageRequest;
use App\Http\Requests\Chat\UpdateMessageRequest;
use App\Http\Resources\ChatReportReasonResource;
use App\Http\Resources\MessageResource;
use App\Models\Message;
use App\Services\Chat\ChatModerationService;
use App\Services\Chat\ConversationService;
use App\Services\Chat\MessageService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request, string $conversationId, ConversationService $conversations, MessageService $messages): JsonResponse
    {
        $conversation = $conversations->findForUser($request->user(), $conversationId);
        $cursor = $request->string('cursor')->toString() ?: null;
        $limit = min(50, max(1, (int) $request->integer('limit', 30)));

        $result = $messages->listMessages($request->user(), $conversation, $cursor, $limit);

        return ApiResponse::success([
            'messages' => MessageResource::collection(collect($result['items']))->resolve(),
            'next_cursor' => $result['next_cursor'],
        ]);
    }

    public function store(
        SendMessageRequest $request,
        string $conversationId,
        ConversationService $conversations,
        MessageService $messages,
    ): JsonResponse {
        $conversation = $conversations->findForUser($request->user(), $conversationId);

        $message = $messages->send(
            $request->user(),
            $conversation,
            $request->validated(),
            $request->file('attachment'),
        );

        return ApiResponse::success([
            'message' => (new MessageResource($message))->resolve(),
        ], status: 201);
    }

    public function update(
        UpdateMessageRequest $request,
        string $conversationId,
        string $messageId,
        ConversationService $conversations,
        MessageService $messages,
    ): JsonResponse {
        $conversation = $conversations->findForUser($request->user(), $conversationId);
        $message = $this->findMessage($conversation->id, $messageId);

        $updated = $messages->update(
            $request->user(),
            $conversation,
            $message,
            $request->validated('body'),
        );

        return ApiResponse::success([
            'message' => (new MessageResource($updated))->resolve(),
        ]);
    }

    public function destroy(
        Request $request,
        string $conversationId,
        string $messageId,
        ConversationService $conversations,
        MessageService $messages,
    ): JsonResponse {
        $conversation = $conversations->findForUser($request->user(), $conversationId);
        $message = $this->findMessage($conversation->id, $messageId);

        $deleted = $messages->delete($request->user(), $conversation, $message);

        return ApiResponse::success([
            'message' => (new MessageResource($deleted))->resolve(),
        ]);
    }

    public function reportReasons(Request $request, ChatModerationService $moderation): JsonResponse
    {
        return ApiResponse::success([
            'reasons' => ChatReportReasonResource::collection(
                collect($moderation->localizedReasons()),
            )->resolve(),
        ]);
    }

    public function report(
        ReportMessageRequest $request,
        string $conversationId,
        string $messageId,
        ConversationService $conversations,
        ChatModerationService $moderation,
    ): JsonResponse {
        $conversation = $conversations->findForUser($request->user(), $conversationId);
        $message = $this->findMessage($conversation->id, $messageId);

        $report = $moderation->reportMessage(
            $request->user(),
            $conversation,
            $message,
            $request->validated('reason'),
            $request->validated('details'),
        );

        return ApiResponse::success([
            'report' => [
                'id' => $report->id,
                'message_id' => $report->message_id,
                'reason' => $report->reason,
                'status' => $report->status->value,
                'created_at' => $report->created_at?->toIso8601String(),
            ],
        ], status: 201);
    }

    private function findMessage(string $conversationId, string $messageId): Message
    {
        return Message::query()
            ->where('conversation_id', $conversationId)
            ->where('id', $messageId)
            ->whereNull('archived_at')
            ->firstOrFail();
    }
}
