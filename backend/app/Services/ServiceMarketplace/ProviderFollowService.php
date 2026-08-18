<?php

namespace App\Services\ServiceMarketplace;

use App\Models\ProviderAccount;
use App\Models\ProviderFollow;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

final class ProviderFollowService
{
    public function __construct(
        private readonly ProviderProfileService $providers,
    ) {}

    public function follow(User $user, string $slug): array
    {
        $provider = $this->providers->findActiveBySlug($slug);

        if ($provider->user_id === $user->id) {
            throw new InvalidArgumentException(__('diyar.services.cannot_follow_own_provider'));
        }

        DB::transaction(function () use ($user, $provider) {
            ProviderFollow::query()->firstOrCreate([
                'user_id' => $user->id,
                'provider_account_id' => $provider->id,
            ]);
        });

        return $this->summary($provider, $user);
    }

    public function unfollow(User $user, string $slug): array
    {
        $provider = $this->providers->findActiveBySlug($slug);

        ProviderFollow::query()
            ->where('user_id', $user->id)
            ->where('provider_account_id', $provider->id)
            ->delete();

        return $this->summary($provider, $user);
    }

    /**
     * @return array{followers_count: int, is_following: bool}
     */
    public function summary(ProviderAccount $provider, ?User $user): array
    {
        $followersCount = ProviderFollow::query()
            ->where('provider_account_id', $provider->id)
            ->count();

        $isFollowing = false;
        if ($user !== null) {
            $isFollowing = ProviderFollow::query()
                ->where('user_id', $user->id)
                ->where('provider_account_id', $provider->id)
                ->exists();
        }

        return [
            'followers_count' => $followersCount,
            'is_following' => $isFollowing,
        ];
    }
}
