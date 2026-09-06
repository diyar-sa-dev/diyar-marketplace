<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\UpdatePartnerB2bLeadStatusRequest;
use App\Http\Resources\PartnerB2bLeadResource;
use App\Models\User;
use App\Services\B2b\PartnerB2bLeadService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PartnerB2bLeadController extends Controller
{
    public function __construct(
        private readonly PartnerB2bLeadService $leads,
    ) {}

    public function indexVendor(Request $request): JsonResponse
    {
        return $this->indexForPartner($request, true);
    }

    public function showVendor(Request $request, string $lead): JsonResponse
    {
        return $this->showForPartner($request, true, $lead);
    }

    public function updateVendor(UpdatePartnerB2bLeadStatusRequest $request, string $lead): JsonResponse
    {
        return $this->updateForPartner($request, true, $lead);
    }

    public function indexProvider(Request $request): JsonResponse
    {
        return $this->indexForPartner($request, false);
    }

    public function showProvider(Request $request, string $lead): JsonResponse
    {
        return $this->showForPartner($request, false, $lead);
    }

    public function updateProvider(UpdatePartnerB2bLeadStatusRequest $request, string $lead): JsonResponse
    {
        return $this->updateForPartner($request, false, $lead);
    }

    private function indexForPartner(Request $request, bool $isVendor): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $result = $this->leads->paginateForPartner(
            user: $user,
            isVendor: $isVendor,
            status: $request->query('status'),
            search: $request->query('q'),
            page: max((int) $request->query('page', 1), 1),
            perPage: min(max((int) $request->query('per_page', 10), 1), 50),
        );

        return ApiResponse::success(data: [
            'summary' => $result['summary'],
            'items' => PartnerB2bLeadResource::collection($result['items'])->resolve(),
            'pagination' => $result['pagination'],
        ]);
    }

    private function showForPartner(Request $request, bool $isVendor, string $leadId): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $lead = $this->leads->findForPartner($user, $isVendor, $leadId);

        return ApiResponse::success(data: [
            'lead' => new PartnerB2bLeadResource($lead),
        ]);
    }

    private function updateForPartner(
        UpdatePartnerB2bLeadStatusRequest $request,
        bool $isVendor,
        string $leadId,
    ): JsonResponse {
        /** @var User $user */
        $user = $request->user();

        $lead = $this->leads->updateStatusForPartner(
            user: $user,
            isVendor: $isVendor,
            leadId: $leadId,
            status: (string) $request->validated('status'),
        );

        return ApiResponse::success(
            data: ['lead' => new PartnerB2bLeadResource($lead)],
            message: __('diyar.b2b.lead_status_updated'),
        );
    }
}
