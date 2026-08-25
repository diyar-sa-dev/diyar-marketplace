<?php

namespace App\Http\Controllers\Api\V1\Loyalty;

use App\Http\Controllers\Controller;
use App\Http\Resources\LoyaltyTransactionResource;
use App\Models\User;
use App\Services\Loyalty\LoyaltyQueryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoyaltyController extends Controller
{
    public function __construct(
        private readonly LoyaltyQueryService $loyalty,
    ) {}

    public function show(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return ApiResponse::success([
            'loyalty' => $this->loyalty->summaryForUser($user),
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $paginator = $this->loyalty->paginateTransactionsForUser(
            user: $user,
            type: $request->string('type')->toString() ?: null,
            page: (int) $request->integer('page', 1),
            perPage: (int) $request->integer('per_page', 20),
        );

        return ApiResponse::success([
            'items' => LoyaltyTransactionResource::collection($paginator->getCollection())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function rewards(): JsonResponse
    {
        return ApiResponse::success([
            'items' => [],
            'available' => false,
        ]);
    }
}
