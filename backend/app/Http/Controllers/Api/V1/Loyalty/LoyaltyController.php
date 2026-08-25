<?php

namespace App\Http\Controllers\Api\V1\Loyalty;

use App\Enums\LoyaltyTransactionType;
use App\Http\Controllers\Controller;
use App\Http\Resources\LoyaltyTransactionResource;
use App\Models\User;
use App\Services\Loyalty\LoyaltyQueryService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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

        $validated = $request->validate([
            'type' => ['sometimes', 'nullable', 'string', Rule::in(array_merge(['all'], LoyaltyTransactionType::filterValues()))],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ]);

        $type = isset($validated['type']) ? (string) $validated['type'] : null;

        $paginator = $this->loyalty->paginateTransactionsForUser(
            user: $user,
            type: $type !== 'all' ? $type : null,
            page: (int) ($validated['page'] ?? 1),
            perPage: (int) ($validated['per_page'] ?? 20),
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
