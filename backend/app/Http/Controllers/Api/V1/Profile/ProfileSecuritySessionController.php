<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserSessionDeviceResource;
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
        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;
        $devices = $this->sessions->listGroupedDevicesForUser($request->user(), $currentSessionId);

        return ApiResponse::success(data: [
            'devices' => UserSessionDeviceResource::collection($devices),
        ]);
    }

    public function revokeDevice(Request $request, string $fingerprint): JsonResponse
    {
        $currentSessionId = $request->hasSession() ? $request->session()->getId() : null;

        $count = $this->sessions->revokeDeviceGroup(
            user: $request->user(),
            fingerprint: $fingerprint,
            currentLaravelSessionId: $currentSessionId,
        );

        return ApiResponse::success(
            data: ['revoked_count' => $count],
            message: __('diyar.profile.security.device_revoked'),
        );
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
