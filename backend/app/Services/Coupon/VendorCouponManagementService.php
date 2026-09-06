<?php

namespace App\Services\Coupon;

use App\Enums\CouponScopeType;
use App\Enums\VendorCouponType;
use App\Events\Domain\CouponActivated;
use App\Events\Domain\CouponDeactivated;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorCoupon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
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
        $type = VendorCouponType::from((string) ($payload['type'] ?? VendorCouponType::Percentage->value));
        $this->assertTypePayload($type, $payload);

        $code = VendorCoupon::normalizeCode((string) $payload['code']);

        if ($code === '') {
            throw new InvalidArgumentException(__('diyar.coupons.code_required'));
        }

        try {
            return VendorCoupon::query()->create([
                'vendor_account_id' => $vendor->id,
                'code' => $code,
                'type' => $type,
                'scope_type' => CouponScopeType::from((string) ($payload['scope_type'] ?? CouponScopeType::All->value)),
                'value' => $type === VendorCouponType::Percentage ? (int) $payload['value'] : 0,
                'fixed_amount' => $type === VendorCouponType::Fixed ? $payload['fixed_amount'] : null,
                'minimum_order' => $payload['minimum_order'] ?? 0,
                'maximum_discount' => $payload['maximum_discount'] ?? null,
                'starts_at' => $payload['starts_at'] ?? null,
                'ends_at' => $payload['ends_at'] ?? null,
                'usage_limit' => $payload['usage_limit'] ?? null,
                'usage_limit_per_user' => $payload['usage_limit_per_user'] ?? null,
                'stackable' => $payload['stackable'] ?? false,
                'exclusive_group' => $payload['exclusive_group'] ?? null,
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
            $locked = ['code', 'value', 'type', 'vendor_account_id', 'fixed_amount'];
            foreach ($locked as $field) {
                if (array_key_exists($field, $payload)) {
                    throw new InvalidArgumentException(__('diyar.coupons.cannot_edit_after_use'));
                }
            }
        }

        $updates = [];

        foreach ([
            'minimum_order', 'maximum_discount', 'starts_at', 'ends_at', 'usage_limit',
            'usage_limit_per_user', 'stackable', 'exclusive_group',
        ] as $field) {
            if (array_key_exists($field, $payload)) {
                $updates[$field] = $payload[$field];
            }
        }

        if (array_key_exists('is_active', $payload)) {
            $updates['is_active'] = (bool) $payload['is_active'];
        }

        if (! $coupon->used_count && array_key_exists('value', $payload) && $coupon->type === VendorCouponType::Percentage) {
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
            $previousActive = $coupon->is_active;

            try {
                $coupon->update($updates);
            } catch (QueryException $exception) {
                if ($this->isDuplicateCode($exception)) {
                    throw new ConflictHttpException(__('diyar.coupons.code_exists'));
                }

                throw $exception;
            }

            if (array_key_exists('is_active', $updates) && (bool) $updates['is_active'] !== (bool) $previousActive) {
                $fresh = $coupon->fresh();
                DB::afterCommit(fn () => event(
                    (bool) $updates['is_active']
                        ? new CouponActivated($fresh)
                        : new CouponDeactivated($fresh),
                ));
            }
        }

        return $coupon->fresh();
    }

    public function setActive(User $user, VendorCoupon $coupon, bool $active): VendorCoupon
    {
        $this->findOwned($user, $coupon->id);
        $coupon->update(['is_active' => $active]);
        $fresh = $coupon->fresh();

        DB::afterCommit(fn () => event($active ? new CouponActivated($fresh) : new CouponDeactivated($fresh)));

        return $fresh;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function assertTypePayload(VendorCouponType $type, array $payload): void
    {
        match ($type) {
            VendorCouponType::Percentage => $this->assertPercentageValue((int) ($payload['value'] ?? 0)),
            VendorCouponType::Fixed => $this->assertFixedAmount((string) ($payload['fixed_amount'] ?? '0')),
            VendorCouponType::FreeShipping => null,
        };
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

    private function assertFixedAmount(string $amount): void
    {
        if (bccomp($amount, '0.01', 2) < 0) {
            throw new InvalidArgumentException(__('diyar.coupons.invalid'));
        }
    }

    private function isDuplicateCode(QueryException $exception): bool
    {
        $sqlState = $exception->errorInfo[0] ?? null;

        return in_array($sqlState, ['23000', '23505'], true);
    }
}
