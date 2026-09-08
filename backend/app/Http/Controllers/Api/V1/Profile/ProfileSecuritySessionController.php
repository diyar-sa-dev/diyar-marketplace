<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserSessionResource;
use App\Services\Security\UserSessionService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileSecuritySessionController extends Controller
{
    public function __construct(
        private readonly UserSessionService $sessions,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $items = $this->sessions->listActiveForUser($request->user());

        return ApiResponse::success(data: [
            'sessions' => UserSessionResource::collection($items),
        ]);
    }

    public function destroy(Request $request, string $session): JsonResponse
    {
        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;

        $this->sessions->revokeOwnedSession(
            user: $request->user(),
            publicSessionId: $session,
            currentLaravelSessionId: $currentSessionId,
        );

        return ApiResponse::success(message: __('diyar.profile.security.session_revoked'));
    }

    public function logoutOthers(Request $request): JsonResponse
    {
        if (! $request->hasSession()) {
            abort(400, __('diyar.profile.security.session_required'));
        }

        $count = $this->sessions->revokeOthers($request->user(), $request->session()->getId());

        return ApiResponse::success(
            data: ['revoked_count' => $count],
            message: __('diyar.profile.security.other_sessions_revoked'),
        );
    }
}
