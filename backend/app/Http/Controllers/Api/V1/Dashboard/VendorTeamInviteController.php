<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Services\Vendor\VendorTeamService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class VendorTeamInviteController extends Controller
{
    public function __construct(
        private readonly VendorTeamService $team,
    ) {}

    public function show(string $token): JsonResponse
    {
        try {
            return ApiResponse::success([
                'invite' => $this->team->previewInvite($token),
            ]);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 404);
        }
    }

    public function accept(Request $request, string $token): JsonResponse
    {
        try {
            $member = $this->team->acceptInvite($request->user(), $token);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(
            ['member' => $member],
            message: __('diyar.vendor.team.invite_accepted'),
        );
    }

    public function reject(Request $request, string $token): JsonResponse
    {
        try {
            $this->team->rejectInvite($request->user(), $token);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success(message: __('diyar.vendor.team.invite_rejected'));
    }
}
