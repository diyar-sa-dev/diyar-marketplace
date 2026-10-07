<?php

namespace App\Domains\Chat\Controllers;

use App\Core\Support\Api\ApiResponse;
use App\Domains\Chat\Requests\CreateConversationRequest;
use App\Domains\Chat\Resources\ConversationResource;
use App\Domains\Chat\Services\ChatPresenceService;
use App\Domains\Chat\Services\ChatRealtimeBroadcaster;
use App\Domains\Chat\Services\ChatTypingService;
use App\Domains\Chat\Services\ChatUnreadCounterService;
use App\Domains\Chat\Services\ConversationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    public function index(Request $request, ConversationService $conversations): JsonResponse
    {
        $page = max(1, (int) $request->integer('page', 1));
        $perPage = min(50, max(1, (int) $request->integer('per_page', 20)));

        $result = $conversations->listForUser($request->user(), $page, $perPage);

        return ApiResponse::success([
            'conversations' => ConversationResource::collection(collect($result['items']))->resolve(),
            'pagination' => $result['pagination'],
        ]);
    }

    public function store(CreateConversationRequest $request, ConversationService $conversations): JsonResponse
    {
        $conversation = $conversations->create($request->user(), $request->validated());

        return ApiResponse::success([
            'conversation' => (new ConversationResource($conversation))->resolve(),
        ], status: 201);
    }

    public function show(Request $request, string $id, ConversationService $conversations): JsonResponse
    {
        $conversation = $conversations->findForUser($request->user(), $id);

        return ApiResponse::success([
            'conversation' => (new ConversationResource($conversation))->resolve(),
        ]);
    }

    public function markRead(Request $request, string $id, ConversationService $conversations): JsonResponse
    {
        $conversation = $conversations->findForUser($request->user(), $id);
        $conversations->markRead($request->user(), $conversation);

        return ApiResponse::success(message: __('diyar.chat.marked_read'));
    }

    public function destroy(Request $request, string $id, ConversationService $conversations): JsonResponse
    {
        $conversation = $conversations->findForUser($request->user(), $id);
        $conversations->removeFromInbox($request->user(), $conversation);

        return ApiResponse::success(message: __('diyar.chat.removed_from_inbox'));
    }

    public function unreadCount(Request $request, ChatUnreadCounterService $unreadCounter): JsonResponse
    {
        return ApiResponse::success([
            'unread_count' => $unreadCounter->totalForUser($request->user()),
        ]);
    }

    public function typing(Request $request, string $id, ConversationService $conversations, ChatTypingService $typing): JsonResponse
    {
        $conversation = $conversations->findForUser($request->user(), $id);
        $isTyping = $request->boolean('typing');

        app(ChatPresenceService::class)->touch($request->user(), $conversation->id);

        $shouldBroadcast = $typing->setTyping($conversation->id, $request->user(), $isTyping);

        if ($shouldBroadcast) {
            app(ChatRealtimeBroadcaster::class)->typing(
                $conversation->id,
                $request->user()->id,
                (string) $request->user()->name,
                $isTyping,
            );
        }

        return ApiResponse::success();
    }
}
