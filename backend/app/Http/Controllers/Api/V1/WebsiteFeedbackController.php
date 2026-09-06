<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreWebsiteFeedbackRequest;
use App\Http\Resources\WebsiteFeedbackResource;
use App\Models\WebsiteFeedback;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebsiteFeedbackController extends Controller
{
    public function store(StoreWebsiteFeedbackRequest $request): JsonResponse
    {
        $user = $request->user();
        $guestKey = trim((string) $request->input('guest_key', ''));

        if ($user === null && $guestKey === '') {
            return ApiResponse::error(
                message: __('diyar.feedback.guest_key_required'),
                status: 422,
                errors: ['guest_key' => [__('diyar.feedback.guest_key_required')]],
            );
        }

        $existing = WebsiteFeedback::query()
            ->when($user !== null, fn ($query) => $query->where('user_id', $user->id))
            ->when($user === null, fn ($query) => $query->where('guest_key', $guestKey))
            ->first();

        if ($existing !== null) {
            return ApiResponse::error(
                message: __('diyar.feedback.already_submitted'),
                status: 409,
            );
        }

        $feedback = WebsiteFeedback::query()->create([
            'user_id' => $user?->id,
            'guest_key' => $user === null ? $guestKey : null,
            'rating' => (int) $request->integer('rating'),
            'type' => (string) $request->string('type'),
            'message' => trim((string) $request->string('message')),
            'locale' => app()->getLocale(),
        ]);

        $feedback->load('user');

        return ApiResponse::success(
            data: ['feedback' => new WebsiteFeedbackResource($feedback)],
            status: 201,
        );
    }

    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        $guestKey = trim((string) $request->query('guest_key', ''));

        $submitted = WebsiteFeedback::query()
            ->when($user !== null, fn ($query) => $query->where('user_id', $user->id))
            ->when($user === null && $guestKey !== '', fn ($query) => $query->where('guest_key', $guestKey))
            ->when($user === null && $guestKey === '', fn ($query) => $query->whereRaw('1 = 0'))
            ->exists();

        return ApiResponse::success(data: ['submitted' => $submitted]);
    }
}
