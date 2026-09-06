<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Resources\B2bCompanyReviewResource;
use App\Services\B2b\B2bCompanyReviewService;
use App\Services\B2b\PartnerB2bCompanyService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class PartnerB2bReviewController extends Controller
{
    public function __construct(
        private readonly PartnerB2bCompanyService $partnerB2b,
        private readonly B2bCompanyReviewService $reviews,
    ) {}

    public function indexVendor(Request $request): JsonResponse
    {
        return $this->indexForPortal($request, 'vendor');
    }

    public function indexProvider(Request $request): JsonResponse
    {
        return $this->indexForPortal($request, 'provider');
    }

    private function indexForPortal(Request $request, string $portal): JsonResponse
    {
        $company = $portal === 'vendor'
            ? $this->partnerB2b->findForVendor($request->user())
            : $this->partnerB2b->findForProvider($request->user());

        if ($company === null) {
            throw new NotFoundHttpException(__('diyar.b2b.company_not_found'));
        }

        $paginator = $this->reviews->paginateForPartnerCompany(
            $company,
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 10),
        );

        return ApiResponse::success(data: [
            'items' => B2bCompanyReviewResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }
}
