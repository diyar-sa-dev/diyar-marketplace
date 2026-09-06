<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\NotificationDeliveryStatus;
use App\Enums\NotificationPriority;
use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationDeliveryResource;
use App\Http\Resources\UserNotificationResource;
use App\Jobs\Notifications\DeliverNotificationChannelJob;
use App\Models\NotificationDelivery;
use App\Models\UserNotification;
use App\Support\Api\ApiResponse;
use App\Support\Notifications\NotificationQueue;
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
        $notification->load(['user', 'deliveries']);

        return ApiResponse::success(data: [
            'notification' => new UserNotificationResource($notification),
            'deliveries' => NotificationDeliveryResource::collection($notification->deliveries),
        ]);
    }

    public function deliveries(Request $request): JsonResponse
    {
        $query = NotificationDelivery::query()->with(['user', 'notification']);

        if ($status = $request->string('status')->toString()) {
            $query->where('status', $status);
        }

        if ($channel = $request->string('channel')->toString()) {
            $query->where('channel', $channel);
        }

        if ($userId = $request->string('user_id')->toString()) {
            $query->where('user_id', $userId);
        }

        $paginator = $query->orderByDesc('updated_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('deliveries', NotificationDeliveryResource::collection($paginator->items()), $paginator);
    }

    public function retryDelivery(NotificationDelivery $delivery): JsonResponse
    {
        if ($delivery->status === NotificationDeliveryStatus::Delivered) {
            return ApiResponse::error(
                message: __('diyar.notifications.delivery_already_delivered'),
                status: 422,
            );
        }

        $delivery->update([
            'status' => NotificationDeliveryStatus::Queued,
            'last_error' => null,
            'failure_code' => null,
            'failure_category' => null,
            'failed_at' => null,
            'next_retry_at' => null,
        ]);

        $notification = $delivery->notification;

        DeliverNotificationChannelJob::dispatch(
            $delivery->id,
            is_array($notification?->data) ? $notification->data : [],
        )
            ->afterCommit()
            ->onQueue(NotificationQueue::forPriority($notification?->priority ?? NotificationPriority::Normal));

        return ApiResponse::success(data: [
            'delivery' => new NotificationDeliveryResource($delivery->fresh()),
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
