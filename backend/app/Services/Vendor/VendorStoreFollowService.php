<?php

namespace App\Services\Vendor;

use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorStoreFollow;
use App\Services\Catalog\VendorService;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class VendorStoreFollowService
{
    public function __construct(
        private readonly VendorService $vendors,
    ) {}

    public function follow(User $user, string $slug): array
    {
        $vendor = $this->vendors->findActiveBySlug($slug);

        if ($vendor->user_id === $user->id) {
            throw new InvalidArgumentException(__('diyar.vendor.cannot_follow_own_store'));
        }

        DB::transaction(function () use ($user, $vendor) {
            VendorStoreFollow::query()->firstOrCreate([
                'user_id' => $user->id,
                'vendor_account_id' => $vendor->id,
            ]);
        });

        return $this->summary($vendor, $user);
    }

    public function unfollow(User $user, string $slug): array
    {
        $vendor = $this->vendors->findActiveBySlug($slug);

        VendorStoreFollow::query()
            ->where('user_id', $user->id)
            ->where('vendor_account_id', $vendor->id)
            ->delete();

        return $this->summary($vendor, $user);
    }

    /**
     * @return array{followers_count: int, is_following: bool}
     */
    public function summary(VendorAccount $vendor, ?User $user): array
    {
        $followersCount = VendorStoreFollow::query()
            ->where('vendor_account_id', $vendor->id)
            ->count();

        $isFollowing = false;
        if ($user !== null) {
            $isFollowing = VendorStoreFollow::query()
                ->where('user_id', $user->id)
                ->where('vendor_account_id', $vendor->id)
                ->exists();
        }

        return [
            'followers_count' => $followersCount,
            'is_following' => $isFollowing,
        ];
    }
}
