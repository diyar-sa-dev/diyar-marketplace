<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreB2bCompanyRequest;
use App\Http\Requests\Admin\UpdateB2bCompanyRequest;
use App\Http\Resources\B2bCategoryResource;
use App\Http\Resources\B2bCompanyCardResource;
use App\Http\Resources\B2bCompanyDetailResource;
use App\Http\Resources\B2bLeadResource;
use App\Http\Resources\B2bTagResource;
use App\Models\B2bCategory;
use App\Models\B2bCompany;
use App\Models\B2bLead;
use App\Models\B2bTag;
use App\Models\User;
use App\Services\B2b\AdminB2bService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class AdminB2bCompanyController extends Controller
{
    public function __construct(
        private readonly AdminB2bService $b2b,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', B2bCompany::class);

        $query = B2bCompany::query()->with(['category', 'tags']);

        if ($status = $request->string('publication_status')->toString() ?: $request->string('status')->toString()) {
            $query->where('publication_status', $status);
        }

        if ($verification = $request->string('verification_status')->toString()) {
            $query->where('verification_status', $verification);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where(function ($builder) use ($search): void {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%");
            });
        }

        $paginator = $query->orderByDesc('updated_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('companies', B2bCompanyCardResource::collection($paginator->items()), $paginator);
    }

    public function store(StoreB2bCompanyRequest $request): JsonResponse
    {
        $this->authorize('create', B2bCompany::class);

        $company = $this->b2b->createCompany(
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(
            data: ['company' => new B2bCompanyDetailResource($company)],
            status: 201,
        );
    }

    public function show(string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($model),
        ]);
    }

    public function update(UpdateB2bCompanyRequest $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('update', $model);

        $updated = $this->b2b->updateCompany(
            $model,
            $request->validated(),
            $this->adminActor($request),
        );

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function destroy(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('delete', $model);

        $this->b2b->deleteCompany($model, $this->adminActor($request));

        return ApiResponse::success();
    }

    public function publish(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('publish', $model);

        $updated = $this->b2b->publishCompany($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function unpublish(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('unpublish', $model);

        $updated = $this->b2b->unpublishCompany($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function archive(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('archive', $model);

        $updated = $this->b2b->archiveCompany($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function verify(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('verify', $model);

        $updated = $this->b2b->verifyCompany($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function rejectVerification(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('verify', $model);

        $updated = $this->b2b->rejectCompanyVerification($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function feature(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('feature', $model);

        $updated = $this->b2b->featureCompany($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function unfeature(Request $request, string $company): JsonResponse
    {
        $model = $this->findCompany($company);
        $this->authorize('feature', $model);

        $updated = $this->b2b->unfeatureCompany($model, $this->adminActor($request));

        return ApiResponse::success(data: [
            'company' => new B2bCompanyDetailResource($updated),
        ]);
    }

    public function categories(): JsonResponse
    {
        $this->authorize('viewAny', B2bCompany::class);

        $categories = B2bCategory::query()->orderBy('name')->get();

        return ApiResponse::success(data: [
            'categories' => B2bCategoryResource::collection($categories)->resolve(),
        ]);
    }

    public function tags(): JsonResponse
    {
        $this->authorize('viewAny', B2bCompany::class);

        $tags = B2bTag::query()->orderBy('name')->get();

        return ApiResponse::success(data: [
            'tags' => B2bTagResource::collection($tags)->resolve(),
        ]);
    }

    public function leads(Request $request): JsonResponse
    {
        $query = B2bLead::query()->with(['company.category', 'company.tags', 'user']);

        if ($companyId = $request->string('company_id')->toString()) {
            $query->where('b2b_company_id', $companyId);
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated('leads', B2bLeadResource::collection($paginator->items()), $paginator);
    }

    public function showLead(string $lead): JsonResponse
    {
        $model = B2bLead::query()
            ->with(['company.category', 'company.tags', 'user'])
            ->find($lead);

        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.b2b.lead_not_found'));
        }

        $this->authorize('view', $model);

        return ApiResponse::success(data: [
            'lead' => new B2bLeadResource($model),
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

    private function findCompany(string $company): B2bCompany
    {
        $model = B2bCompany::query()
            ->with(['category', 'tags', 'services', 'testimonials', 'projects'])
            ->find($company);

        if ($model === null) {
            throw new NotFoundHttpException(__('diyar.b2b.company_not_found'));
        }

        return $model;
    }

    private function adminActor(Request $request): User
    {
        /** @var User $admin */
        $admin = $request->user('admin');

        return $admin;
    }
}
