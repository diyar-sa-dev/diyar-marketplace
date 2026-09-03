<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\FinancialTransactionResource;
use App\Models\FinancialTransaction;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminFinancialTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FinancialTransaction::query()->with(['vendorAccount', 'order', 'payment', 'vendorPayout']);

        if ($type = $request->string('transaction_type')->toString()) {
            $query->where('transaction_type', $type);
        }

        if ($direction = $request->string('direction')->toString()) {
            $query->where('direction', $direction);
        }

        if ($vendorId = $request->string('vendor_account_id')->toString()) {
            $query->where('vendor_account_id', $vendorId);
        }

        if ($search = trim((string) $request->string('q'))) {
            $query->where('reference', 'like', "%{$search}%");
        }

        $paginator = $query->orderByDesc('created_at')->paginate(
            perPage: min(max((int) $request->integer('per_page', 20), 1), 100),
        );

        return $this->paginated(
            'transactions',
            FinancialTransactionResource::collection($paginator->items())->resolve(),
            $paginator,
        );
    }

    public function show(FinancialTransaction $transaction): JsonResponse
    {
        $transaction->load(['vendorAccount', 'order', 'payment', 'vendorPayout', 'paymentVendorAllocation']);

        return ApiResponse::success(data: [
            'transaction' => new FinancialTransactionResource($transaction),
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
}
