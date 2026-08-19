<?php

namespace App\Services\Coupon;

use App\Enums\VendorCouponType;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorCoupon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

final class VendorCouponManagementService
{
    public function listForVendor(User $user, int $page, int $perPage): LengthAwarePaginator
    {
        $vendor = $this->requireVendorAccount($user);

        return VendorCoupon::query()
            ->where('vendor_account_id', $vendor->id)
            ->orderByDesc('created_at')
            ->paginate(perPage: $perPage, page: $page);
    }

    public function findOwned(User $user, string $couponId): VendorCoupon
    {
        $vendor = $this->requireVendorAccount($user);
        $coupon = VendorCoupon::query()->whereKey($couponId)->first();

        if ($coupon === null || $coupon->vendor_account_id !== $vendor->id) {
            throw new NotFoundHttpException(__('diyar.coupons.not_found'));
        }

        return $coupon;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function create(User $user, array $payload): VendorCoupon
    {
        $vendor = $this->requireVendorAccount($user);
        $this->assertPercentageValue((int) $payload['value']);

        $code = VendorCoupon::normalizeCode((string) $payload['code']);

        if ($code === '') {
            throw new InvalidArgumentException(__('diyar.coupons.code_required'));
        }

        try {
            return VendorCoupon::query()->create([
                'vendor_account_id' => $vendor->id,
                'code' => $code,
                'type' => VendorCouponType::Percentage,
                'value' => (int) $payload['value'],
                'minimum_order' => $payload['minimum_order'] ?? 0,
                'maximum_discount' => $payload['maximum_discount'] ?? null,
                'starts_at' => $payload['starts_at'] ?? null,
                'ends_at' => $payload['ends_at'] ?? null,
                'usage_limit' => $payload['usage_limit'] ?? null,
                'is_active' => $payload['is_active'] ?? true,
            ]);
        } catch (QueryException $exception) {
            if ($this->isDuplicateCode($exception)) {
                throw new ConflictHttpException(__('diyar.coupons.code_exists'));
            }

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public function update(User $user, VendorCoupon $coupon, array $payload): VendorCoupon
    {
        $this->findOwned($user, $coupon->id);

        if ($coupon->used_count > 0) {
            $locked = ['code', 'value', 'type', 'vendor_account_id'];
            foreach ($locked as $field) {
                if (array_key_exists($field, $payload)) {
                    throw new InvalidArgumentException(__('diyar.coupons.cannot_edit_after_use'));
                }
            }
        }

        $updates = [];

        if (array_key_exists('minimum_order', $payload)) {
            $updates['minimum_order'] = $payload['minimum_order'];
        }
        if (array_key_exists('maximum_discount', $payload)) {
            $updates['maximum_discount'] = $payload['maximum_discount'];
        }
        if (array_key_exists('starts_at', $payload)) {
            $updates['starts_at'] = $payload['starts_at'];
        }
        if (array_key_exists('ends_at', $payload)) {
            $updates['ends_at'] = $payload['ends_at'];
        }
        if (array_key_exists('usage_limit', $payload)) {
            $updates['usage_limit'] = $payload['usage_limit'];
        }
        if (array_key_exists('is_active', $payload)) {
            $updates['is_active'] = (bool) $payload['is_active'];
        }

        if (! $coupon->used_count && array_key_exists('value', $payload)) {
            $this->assertPercentageValue((int) $payload['value']);
            $updates['value'] = (int) $payload['value'];
        }

        if (! $coupon->used_count && array_key_exists('code', $payload)) {
            $code = VendorCoupon::normalizeCode((string) $payload['code']);
            if ($code === '') {
                throw new InvalidArgumentException(__('diyar.coupons.code_required'));
            }
            $updates['code'] = $code;
        }

        if ($updates !== []) {
            try {
                $coupon->update($updates);
            } catch (QueryException $exception) {
                if ($this->isDuplicateCode($exception)) {
                    throw new ConflictHttpException(__('diyar.coupons.code_exists'));
                }

                throw $exception;
            }
        }

        return $coupon->fresh();
    }

    public function setActive(User $user, VendorCoupon $coupon, bool $active): VendorCoupon
    {
        $this->findOwned($user, $coupon->id);
        $coupon->update(['is_active' => $active]);

        return $coupon->fresh();
    }

    private function requireVendorAccount(User $user): VendorAccount
    {
        $vendor = $user->vendorAccount;

        if ($vendor === null) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }

        return $vendor;
    }

    private function assertPercentageValue(int $value): void
    {
        $min = (int) config('diyar.coupons.percentage_min', 5);
        $max = (int) config('diyar.coupons.percentage_max', 90);

        if ($value < $min || $value > $max) {
            throw new InvalidArgumentException(__('diyar.coupons.invalid_percentage', [
                'min' => $min,
                'max' => $max,
            ]));
        }
    }

    private function isDuplicateCode(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
