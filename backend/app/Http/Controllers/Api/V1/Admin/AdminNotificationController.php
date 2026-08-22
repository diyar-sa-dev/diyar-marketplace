<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserNotificationResource;
use App\Models\UserNotification;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminNotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = UserNotification::query()->with('user');

        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }

        if ($userId = $request->string('user_id')->toString()) {
            $query->where('user_id', $userId);
        }

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('notifications', UserNotificationResource::collection($paginator->items()), $paginator);
    }

    public function show(UserNotification $notification): JsonResponse
    {
        $notification->load('user');

        return ApiResponse::success(data: [
            'notification' => new UserNotificationResource($notification),
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
}
