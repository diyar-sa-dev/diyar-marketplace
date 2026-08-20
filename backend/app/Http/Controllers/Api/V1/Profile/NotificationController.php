<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserNotificationResource;
use App\Services\Notifications\NotificationDeviceService;
use App\Services\Notifications\NotificationService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private readonly NotificationService $notifications,
        private readonly NotificationDeviceService $devices,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $page = max((int) $request->query('page', 1), 1);
        $perPage = min(max((int) $request->query('per_page', 20), 1), 50);
        $status = $request->query('status');
        $unreadOnly = $status === 'unread' || $request->query('unread') === '1' || $request->query('unread') === 'true';
        $readOnly = $status === 'read';
        $category = $request->query('category');

        $paginator = $this->notifications->paginate(
            $request->user(),
            $page,
            $perPage,
            $unreadOnly ? true : null,
            $readOnly ? true : null,
            is_string($category) ? $category : null,
        );

        return ApiResponse::success(data: [
            'notifications' => UserNotificationResource::collection($paginator->items())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return ApiResponse::success(data: [
            'unread_count' => $this->notifications->unreadCount($request->user()),
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $record = $this->notifications->markAsRead($request->user(), $notification);

        return ApiResponse::success(data: [
            'notification' => new UserNotificationResource($record),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->notifications->markAllAsRead($request->user());

        return ApiResponse::success(data: [
            'updated_count' => $count,
        ]);
    }

    public function destroy(Request $request, string $notification): JsonResponse
    {
        $this->notifications->delete($request->user(), $notification);

        return ApiResponse::success(message: __('diyar.notifications.deleted'));
    }

    public function destroyAll(Request $request): JsonResponse
    {
        $count = $this->notifications->deleteAll($request->user());

        return ApiResponse::success(data: [
            'deleted_count' => $count,
        ]);
    }

    public function registerDevice(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:512'],
            'platform' => ['required', 'string', 'in:web,ios,android'],
            'device_identifier' => ['nullable', 'string', 'max:191'],
        ]);

        $device = $this->devices->register(
            $request->user(),
            $validated['token'],
            $validated['platform'],
            $validated['device_identifier'] ?? null,
        );

        return ApiResponse::success(data: [
            'device' => [
                'id' => $device->id,
                'platform' => $device->platform,
                'active' => $device->active,
            ],
        ]);
    }
}
