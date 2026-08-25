<?php

namespace App\Http\Controllers\Api\V1\Dashboard;

use App\Http\Controllers\Controller;
use App\Http\Requests\Dashboard\StorePartnerB2bCompanyRequest;
use App\Http\Requests\Dashboard\UpdatePartnerB2bCompanyRequest;
use App\Http\Requests\Dashboard\UploadPartnerB2bImageRequest;
use App\Http\Requests\Dashboard\UploadPartnerB2bPortfolioImageRequest;
use App\Http\Resources\B2bCategoryResource;
use App\Http\Resources\B2bCompanyDetailResource;
use App\Http\Resources\B2bTagResource;
use App\Models\B2bCategory;
use App\Models\B2bTag;
use App\Services\B2b\PartnerB2bCompanyService;
use App\Services\Media\MediaUploadService;
use App\Support\Api\ApiResponse;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class PartnerB2bCompanyController extends Controller
{
    public function __construct(
        private readonly PartnerB2bCompanyService $partnerB2b,
        private readonly MediaUploadService $media,
    ) {}

    public function showVendor(Request $request): JsonResponse
    {
        $company = $this->partnerB2b->findForVendor($request->user());

        return ApiResponse::success([
            'company' => $company ? new B2bCompanyDetailResource($company) : null,
        ]);
    }

    public function storeVendor(StorePartnerB2bCompanyRequest $request): JsonResponse
    {
        $company = $this->partnerB2b->createForVendor($request->user(), $request->validated());

        return ApiResponse::success(
            ['company' => new B2bCompanyDetailResource($company)],
            message: __('diyar.b2b.company_created'),
            status: 201,
        );
    }

    public function updateVendor(UpdatePartnerB2bCompanyRequest $request): JsonResponse
    {
        $company = $this->partnerB2b->updateForVendor($request->user(), $request->validated());

        return ApiResponse::success(
            ['company' => new B2bCompanyDetailResource($company)],
            message: __('diyar.b2b.company_updated'),
        );
    }

    public function showProvider(Request $request): JsonResponse
    {
        $company = $this->partnerB2b->findForProvider($request->user());

        return ApiResponse::success([
            'company' => $company ? new B2bCompanyDetailResource($company) : null,
        ]);
    }

    public function storeProvider(StorePartnerB2bCompanyRequest $request): JsonResponse
    {
        $company = $this->partnerB2b->createForProvider($request->user(), $request->validated());

        return ApiResponse::success(
            ['company' => new B2bCompanyDetailResource($company)],
            message: __('diyar.b2b.company_created'),
            status: 201,
        );
    }

    public function updateProvider(UpdatePartnerB2bCompanyRequest $request): JsonResponse
    {
        $company = $this->partnerB2b->updateForProvider($request->user(), $request->validated());

        return ApiResponse::success(
            ['company' => new B2bCompanyDetailResource($company)],
            message: __('diyar.b2b.company_updated'),
        );
    }

    public function uploadVendorImage(UploadPartnerB2bImageRequest $request): JsonResponse
    {
        return $this->uploadImage($request, 'vendor');
    }

    public function uploadProviderImage(UploadPartnerB2bImageRequest $request): JsonResponse
    {
        return $this->uploadImage($request, 'provider');
    }

    public function uploadVendorPortfolio(UploadPartnerB2bPortfolioImageRequest $request): JsonResponse
    {
        return $this->uploadPortfolio($request, 'vendor');
    }

    public function uploadProviderPortfolio(UploadPartnerB2bPortfolioImageRequest $request): JsonResponse
    {
        return $this->uploadPortfolio($request, 'provider');
    }

    public function deleteVendorPortfolio(Request $request, string $image): JsonResponse
    {
        $company = $this->partnerB2b->deletePortfolioImageForVendor($request->user(), $image);

        return ApiResponse::success(['company' => new B2bCompanyDetailResource($company)]);
    }

    public function deleteProviderPortfolio(Request $request, string $image): JsonResponse
    {
        $company = $this->partnerB2b->deletePortfolioImageForProvider($request->user(), $image);

        return ApiResponse::success(['company' => new B2bCompanyDetailResource($company)]);
    }

    public function categoriesVendor(): JsonResponse
    {
        return $this->categoriesResponse();
    }

    public function categoriesProvider(): JsonResponse
    {
        return $this->categoriesResponse();
    }

    public function tagsVendor(): JsonResponse
    {
        return $this->tagsResponse();
    }

    public function tagsProvider(): JsonResponse
    {
        return $this->tagsResponse();
    }

    private function categoriesResponse(): JsonResponse
    {
        $categories = B2bCategory::query()->orderBy('name')->get();

        return ApiResponse::success([
            'categories' => B2bCategoryResource::collection($categories)->resolve(),
        ]);
    }

    private function tagsResponse(): JsonResponse
    {
        $tags = B2bTag::query()->orderBy('name')->get();

        return ApiResponse::success([
            'tags' => B2bTagResource::collection($tags)->resolve(),
        ]);
    }

    private function uploadImage(UploadPartnerB2bImageRequest $request, string $portal): JsonResponse
    {
        $type = $request->validated()['type'];
        $directory = $type === 'logo'
            ? (string) config('diyar_media.cms_directories.b2b_logo', 'cms/b2b/logo')
            : (string) config('diyar_media.cms_directories.b2b_cover', 'cms/b2b/cover');

        try {
            $path = $this->media->storeCmsImage(
                user: $request->user(),
                file: $request->file('image'),
                directory: $directory,
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success([
            'path' => $path,
            'url' => CmsImageUrl::resolve($path),
            'type' => $type,
        ]);
    }

    private function uploadPortfolio(UploadPartnerB2bPortfolioImageRequest $request, string $portal): JsonResponse
    {
        $directory = (string) config('diyar_media.cms_directories.b2b_portfolio', 'cms/b2b/portfolio');

        try {
            $path = $this->media->storeCmsImage(
                user: $request->user(),
                file: $request->file('image'),
                directory: $directory,
            );
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        $company = $portal === 'vendor'
            ? $this->partnerB2b->addPortfolioImageForVendor($request->user(), $path)
            : $this->partnerB2b->addPortfolioImageForProvider($request->user(), $path);

        return ApiResponse::success([
            'company' => new B2bCompanyDetailResource($company),
            'image' => [
                'path' => $path,
                'url' => CmsImageUrl::resolve($path),
            ],
        ]);
    }
}
