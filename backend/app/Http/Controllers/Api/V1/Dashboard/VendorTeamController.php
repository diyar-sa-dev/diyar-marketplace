<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Enums\VendorTeamRole;
use App\Enums\VendorTeamStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\InviteVendorTeamMemberRequest;
use App\Http\Requests\Dashboard\UpdateVendorTeamMemberRequest;
use App\Models\VendorTeamMember;
use App\Services\Vendor\VendorAccessService;
use App\Services\Vendor\VendorTeamRoleSync;
use App\Services\Vendor\VendorTeamService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorTeamController extends Controller
{
    public function __construct(
        private readonly VendorAccessService $access,
        private readonly VendorTeamService $team,
        private readonly VendorTeamRoleSync $roleSync,
    ) {}

    public function access(Request $request): JsonResponse
    {
        $user = $request->user();
        $this->roleSync->onMembershipDeactivated($user);
        $user = $user->fresh(['roles', 'vendorAccount']);

        return ApiResponse::success([
            'access' => $this->access->accessPayload($user),
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $this->access->requireOwner($request->user());

        $page = max(1, (int) $request->integer('page', 1));
        $perPage = min(20, max(1, (int) $request->integer('per_page', 10)));
        $status = $request->string('status')->toString();
        $status = in_array($status, ['active', 'invited'], true) ? $status : null;

        return ApiResponse::success($this->team->list($request->user(), $page, $perPage, $status));
    }

    public function invite(InviteVendorTeamMemberRequest $request): JsonResponse
    {
        $member = $this->team->invite(
            $request->user(),
            $request->validated('email'),
            VendorTeamRole::from($request->validated('role')),
            $request->validated('locale') ?? app()->getLocale(),
        );

        return ApiResponse::success(
            ['member' => $member],
            message: __('diyar.vendor.team.invite_sent'),
            status: 201,
        );
    }

    public function update(UpdateVendorTeamMemberRequest $request, VendorTeamMember $member): JsonResponse
    {
        $updated = $this->team->updateRole(
            $request->user(),
            $member,
            VendorTeamRole::from($request->validated('role')),
        );

        return ApiResponse::success(
            ['member' => $updated],
            message: __('diyar.vendor.team.updated'),
        );
    }

    public function destroy(Request $request, VendorTeamMember $member): JsonResponse
    {
        $wasInvited = $member->status === VendorTeamStatus::Invited;
        $this->team->remove($request->user(), $member);

        return ApiResponse::success(message: __(
            $wasInvited ? 'diyar.vendor.team.invite_cancelled' : 'diyar.vendor.team.removed',
        ));
    }
}
