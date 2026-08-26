<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\NotificationBroadcastAudience;
use App\Enums\NotificationPriority;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreNotificationBroadcastRequest;
use App\Http\Resources\NotificationBroadcastResource;
use App\Models\NotificationBroadcast;
use App\Services\Notifications\NotificationBroadcastService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminNotificationBroadcastController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $paginator = NotificationBroadcast::query()
            ->orderByDesc('created_at')
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return ApiResponse::success(data: [
            'broadcasts' => NotificationBroadcastResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(
        StoreNotificationBroadcastRequest $request,
        NotificationBroadcastService $service,
    ): JsonResponse {
        $validated = $request->validated();

        $broadcast = $service->create(
            admin: $request->user(),
            title: $validated['title'],
            body: $validated['body'],
            category: $validated['category'] ?? 'system',
            channels: $validated['channels'],
            audienceType: NotificationBroadcastAudience::from($validated['audience_type']),
            audienceFilter: is_array($validated['audience_filter'] ?? null) ? $validated['audience_filter'] : [],
            priority: isset($validated['priority'])
                ? NotificationPriority::from($validated['priority'])
                : NotificationPriority::Low,
            scheduledAt: isset($validated['scheduled_at']) ? new \DateTimeImmutable($validated['scheduled_at']) : null,
            expiresAt: isset($validated['expires_at']) ? new \DateTimeImmutable($validated['expires_at']) : null,
        );

        return ApiResponse::success(
            data: ['broadcast' => new NotificationBroadcastResource($broadcast)],
            status: 201,
        );
    }

    public function show(NotificationBroadcast $broadcast): JsonResponse
    {
        return ApiResponse::success(data: [
            'broadcast' => new NotificationBroadcastResource($broadcast),
        ]);
    }
}
