<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\WebsiteFeedbackResource;
use App\Models\WebsiteFeedback;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminWebsiteFeedbackController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = WebsiteFeedback::query()->with('user');

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('message', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search): void {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }

        if ($request->filled('rating')) {
            $query->where('rating', (int) $request->integer('rating'));
        }

        $paginator = $query
            ->orderByDesc('created_at')
            ->paginate(min(max((int) $request->integer('per_page', 20), 1), 100));

        return ApiResponse::success(data: [
            'feedback' => WebsiteFeedbackResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function destroy(WebsiteFeedback $websiteFeedback): JsonResponse
    {
        $websiteFeedback->delete();

        return ApiResponse::success(data: ['deleted' => true]);
    }
}
