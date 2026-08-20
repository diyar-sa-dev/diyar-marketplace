<?php

namespace App\Http\Controllers\Api\V1\Assistant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Assistant\AssistantChatRequest;
use App\Services\Assistant\AssistantChatService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class AssistantChatController extends Controller
{
    public function __invoke(AssistantChatRequest $request, AssistantChatService $assistant): JsonResponse
    {
        try {
            $reply = $assistant->chat(
                $request->validated('messages'),
                $request->validated('catalog_context'),
                $request->validated('locale') ?? 'ar',
            );
        } catch (RuntimeException $exception) {
            return match ($exception->getMessage()) {
                'assistant_disabled', 'assistant_not_configured' => ApiResponse::error(
                    __('diyar.assistant.unavailable'),
                    503,
                ),
                default => ApiResponse::error(
                    __('diyar.assistant.failed'),
                    502,
                ),
            };
        }

        return ApiResponse::success([
            'reply' => $reply,
        ]);
    }
}
