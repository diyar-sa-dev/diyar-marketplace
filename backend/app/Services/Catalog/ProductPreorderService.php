<?php

namespace App\Services\Catalog;

use App\Enums\AvailabilityMode;
use App\Enums\ProductPreorderStatus;
use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\ProductPreorderRequest;
use App\Models\User;
use App\Models\VendorAccount;
use App\Services\Order\SelfPurchaseGuard;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class ProductPreorderService
{
    public function __construct(
        private readonly ProductService $products,
        private readonly SelfPurchaseGuard $selfPurchaseGuard,
    ) {}

    public function findPublicProduct(string $id): Product
    {
        return $this->products->findPublic($id);
    }

    /**
     * @param  array{name?: string, hex_code?: string}|null  $selectedColor
     */
    public function submit(User $user, Product $product, ?array $selectedColor = null): ProductPreorderRequest
    {
        if ($product->status !== ProductStatus::Active) {
            throw new NotFoundHttpException(__('diyar.catalog.product_not_found'));
        }

        if ($product->availability_mode !== AvailabilityMode::Preorder) {
            throw new InvalidArgumentException(__('diyar.preorder.not_preorder_product'));
        }

        $this->selfPurchaseGuard->assertProductNotSelfPurchase($user, $product);

        $existing = ProductPreorderRequest::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('status', ProductPreorderStatus::Pending)
            ->first();

        if ($existing !== null) {
            throw new ConflictHttpException(__('diyar.preorder.already_requested'));
        }

        try {
            return ProductPreorderRequest::query()->create([
                'user_id' => $user->id,
                'product_id' => $product->id,
                'vendor_account_id' => $product->vendor_account_id,
                'selected_color' => $this->normalizeColor($selectedColor),
                'unit_price' => $product->sale_price,
                'status' => ProductPreorderStatus::Pending,
            ])->load(['product:id,name,slug', 'user:id,name,email,phone']);
        } catch (QueryException) {
            throw new ConflictHttpException(__('diyar.preorder.already_requested'));
        }
    }

    public function paginateForVendor(VendorAccount $vendor, int $page = 1, int $perPage = 15, ?string $status = null): LengthAwarePaginator
    {
        $query = ProductPreorderRequest::query()
            ->with([
                'user:id,name,email,phone,avatar_path',
                'product' => fn ($productQuery) => $productQuery
                    ->withTrashed()
                    ->with(['images.mediaFile']),
            ])
            ->where('vendor_account_id', $vendor->id)
            ->latest();

        if ($status !== null && $status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->paginate(perPage: min(max($perPage, 1), 50), page: max($page, 1));
    }

    public function countPendingForVendor(string $vendorAccountId): int
    {
        return ProductPreorderRequest::query()
            ->where('vendor_account_id', $vendorAccountId)
            ->where('status', ProductPreorderStatus::Pending)
            ->count();
    }

    public function cancelForVendor(User $actor, VendorAccount $vendor, ProductPreorderRequest $request): ProductPreorderRequest
    {
        if ($request->vendor_account_id !== $vendor->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        if ($request->status !== ProductPreorderStatus::Pending) {
            throw new InvalidArgumentException(__('diyar.preorder.not_pending'));
        }

        $request->update([
            'status' => ProductPreorderStatus::Cancelled,
            'cancelled_at' => now(),
        ]);

        return $request->fresh(['user:id,name,email,phone', 'product']);
    }

    public function findPendingForUser(User $user, Product $product): ?ProductPreorderRequest
    {
        return ProductPreorderRequest::query()
            ->where('user_id', $user->id)
            ->where('product_id', $product->id)
            ->where('status', ProductPreorderStatus::Pending)
            ->first();
    }

    /**
     * @param  array{name?: string, hex_code?: string}|null  $selectedColor
     * @return array{name: string, hex_code: string}|null
     */
    private function normalizeColor(?array $selectedColor): ?array
    {
        if ($selectedColor === null) {
            return null;
        }

        $name = trim((string) ($selectedColor['name'] ?? ''));
        $hex = trim((string) ($selectedColor['hex_code'] ?? ''));

        if ($name === '' && $hex === '') {
            return null;
        }

        return [
            'name' => $name,
            'hex_code' => $hex,
        ];
    }
}
