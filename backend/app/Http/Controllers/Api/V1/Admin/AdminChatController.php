<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AdminChatMessageReportResource;
use App\Http\Resources\AdminConversationResource;
use App\Http\Resources\AdminMessageResource;
use App\Models\ChatMessageReport;
use App\Models\Conversation;
use App\Models\User;
use App\Services\Admin\AdminAuditService;
use App\Services\Admin\AdminChatOversightService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

final class AdminChatController extends Controller
{
    public function __construct(
        private readonly AdminChatOversightService $oversight,
        private readonly AdminAuditService $audit,
    ) {}

    public function indexConversations(Request $request): JsonResponse
    {
        $paginator = $this->oversight->searchConversations(
            [
                'type' => $request->string('type')->toString(),
                'user_id' => $request->string('user_id')->toString(),
                'q' => $request->string('q')->toString(),
                'has_reports' => $request->boolean('has_reports'),
            ],
            max((int) $request->integer('page', 1), 1),
            min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        $this->auditListAccess($request->user('admin'), 'chat.conversations.list');

        return $this->paginated(
            'conversations',
            AdminConversationResource::collection($paginator->items()),
            $paginator,
        );
    }

    public function showConversation(Request $request, Conversation $conversation): JsonResponse
    {
        $conversation = $this->oversight->findConversation($conversation->id);

        $this->audit->record($request->user('admin'), 'chat.conversation.view', $conversation);

        return ApiResponse::success(data: [
            'conversation' => new AdminConversationResource($conversation),
        ]);
    }

    public function indexMessages(Request $request, Conversation $conversation): JsonResponse
    {
        $conversation = $this->oversight->findConversation($conversation->id);
        $limit = min(max((int) $request->integer('limit', 50), 1), 100);
        $cursor = $request->string('before')->toString() ?: null;

        $result = $this->oversight->listMessages($conversation, $cursor, $limit);

        $this->audit->record($request->user('admin'), 'chat.conversation.messages.view', $conversation, after: [
            'cursor' => $cursor,
            'limit' => $limit,
            'returned' => count($result['items']),
        ]);

        return ApiResponse::success(data: [
            'messages' => AdminMessageResource::collection($result['items']),
            'next_cursor' => $result['next_cursor'],
        ]);
    }

    public function indexReports(Request $request): JsonResponse
    {
        $paginator = $this->oversight->listReports(
            [
                'status' => $request->string('status')->toString(),
                'reason' => $request->string('reason')->toString(),
                'conversation_id' => $request->string('conversation_id')->toString(),
                'q' => $request->string('q')->toString(),
            ],
            max((int) $request->integer('page', 1), 1),
            min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        $this->auditListAccess($request->user('admin'), 'chat.reports.list');

        return $this->paginated(
            'reports',
            AdminChatMessageReportResource::collection($paginator->items()),
            $paginator,
        );
    }

    public function showReport(Request $request, ChatMessageReport $report): JsonResponse
    {
        $detail = $this->oversight->findReportDetail($report->id);

        $this->audit->record($request->user('admin'), 'chat.report.view', $detail['report']);

        return ApiResponse::success(data: [
            'report' => new AdminChatMessageReportResource($detail['report']),
            'conversation' => new AdminConversationResource($detail['conversation']),
            'messages' => AdminMessageResource::collection($detail['messages']),
        ]);
    }

    public function updateReport(
        \App\Http\Requests\Admin\UpdateChatReportRequest $request,
        ChatMessageReport $report,
    ): JsonResponse {
        $updated = $this->oversight->resolveReport(
            $report->id,
            $request->user('admin'),
            $request->validated('status'),
            $request->validated('resolution_note'),
            $request->validated('action_taken'),
        );

        $this->audit->record($request->user('admin'), 'chat.report.resolve', $updated, after: [
            'status' => $updated->status->value,
            'action_taken' => $updated->action_taken,
        ]);

        return ApiResponse::success(data: [
            'report' => new AdminChatMessageReportResource($updated),
        ]);
    }

    /**
     * @param  mixed  $items
     */
    private function paginated(string $key, $items, LengthAwarePaginator $paginator): JsonResponse
    {
        return ApiResponse::success(data: [
            $key => $items,
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    private function auditListAccess(User $admin, string $action): void
    {
        $this->audit->record($admin, $action);
    }
}
