<?php

namespace App\Services\Affiliate;

use App\Models\AffiliateAttribution;
use App\Models\AffiliateClick;
use App\Models\AffiliateLink;
use App\Models\AffiliateProfile;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

final class AffiliateAttributionService
{
    public function __construct(
        private readonly AffiliateLinkService $links,
        private readonly ProductAffiliateSettingsService $productSettings,
    ) {}

    /**
     * @return array{
     *     affiliate_profile_id: string,
     *     affiliate_link_id: string,
     *     product_id: string,
     *     commission_rate_percent: string,
     *     expires_at: string
     * }|null
     */
    public function recordClick(string $referralCode, string $productId, string $sessionFingerprint, ?string $ip = null, ?User $user = null): ?array
    {
        $link = $this->links->findActiveByReferralCode($referralCode);

        if ($link === null || $link->product_id !== $productId) {
            throw new InvalidArgumentException(__('diyar.affiliate.invalid_referral_code'));
        }

        $link->loadMissing('profile');
        $profile = $link->profile;

        if ($profile === null || $profile->status->value !== 'active') {
            throw new InvalidArgumentException(__('diyar.affiliate.profile_not_active'));
        }

        if ($this->isSelfReferral($profile, $user)) {
            return null;
        }

        $product = Product::query()->findOrFail($productId);
        $this->productSettings->assertAffiliateEnabled($product);

        if (! $this->shouldRecordClick($link->referral_code, $sessionFingerprint, $link->id)) {
            // Skip duplicate click metrics; attribution refresh continues below.
        } else {
            AffiliateClick::query()->create([
                'affiliate_link_id' => $link->id,
                'affiliate_profile_id' => $profile->id,
                'product_id' => $productId,
                'session_fingerprint' => $sessionFingerprint,
                'ip_hash' => $ip !== null ? hash('sha256', $ip) : null,
            ]);

            $link->increment('click_count');
        }

        $expiresAt = now()->addDays((int) config('diyar.affiliate.attribution_window_days', 30));

        $attribution = AffiliateAttribution::query()->updateOrCreate(
            [
                'session_fingerprint' => $sessionFingerprint,
                'product_id' => $productId,
            ],
            [
                'affiliate_profile_id' => $profile->id,
                'affiliate_link_id' => $link->id,
                'user_id' => $user?->id,
                'expires_at' => $expiresAt,
            ],
        );

        if ($user !== null) {
            AffiliateAttribution::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'product_id' => $productId,
                ],
                [
                    'affiliate_profile_id' => $profile->id,
                    'affiliate_link_id' => $link->id,
                    'session_fingerprint' => $sessionFingerprint,
                    'expires_at' => $expiresAt,
                ],
            );
        }

        $payload = $this->toPayload($attribution, $link);

        $this->storeInCache($sessionFingerprint, $productId, $payload);

        if ($user !== null) {
            $this->storeInCacheForUser($user->id, $productId, $payload);
        }

        return $payload;
    }

    /**
     * @return array{
     *     affiliate_profile_id: string,
     *     affiliate_link_id: string,
     *     product_id: string,
     *     commission_rate_percent: string,
     *     expires_at: string
     * }|null
     */
    public function resolveAttributionForProduct(?User $user, ?string $sessionFingerprint, string $productId): ?array
    {
        if ($user !== null) {
            $cached = Cache::get($this->userCacheKey($user->id, $productId));

            if (is_array($cached) && $this->isPayloadValid($cached)) {
                return $this->guardSelfReferral($cached, $user);
            }

            $record = AffiliateAttribution::query()
                ->where('user_id', $user->id)
                ->where('product_id', $productId)
                ->where('expires_at', '>', now())
                ->latest('expires_at')
                ->first();

            if ($record !== null) {
                return $this->guardSelfReferral($this->payloadFromRecord($record), $user);
            }
        }

        if ($sessionFingerprint !== null && $sessionFingerprint !== '') {
            $cached = Cache::get($this->sessionCacheKey($sessionFingerprint, $productId));

            if (is_array($cached) && $this->isPayloadValid($cached)) {
                return $this->guardSelfReferral($cached, $user);
            }

            $record = AffiliateAttribution::query()
                ->where('session_fingerprint', $sessionFingerprint)
                ->where('product_id', $productId)
                ->where('expires_at', '>', now())
                ->latest('expires_at')
                ->first();

            if ($record !== null) {
                return $this->guardSelfReferral($this->payloadFromRecord($record), $user);
            }
        }

        return null;
    }

    /**
     * @param  array{
     *     affiliate_profile_id: string,
     *     affiliate_link_id: string,
     *     product_id: string,
     *     commission_rate_percent: string,
     *     expires_at: string
     * }  $payload
     * @return array<string, mixed>|null
     */
    private function guardSelfReferral(array $payload, ?User $user): ?array
    {
        if ($user === null) {
            return $payload;
        }

        $profile = AffiliateProfile::query()->find($payload['affiliate_profile_id']);

        if ($profile !== null && $this->isSelfReferral($profile, $user)) {
            return null;
        }

        return $payload;
    }

    private function isSelfReferral(AffiliateProfile $profile, ?User $user): bool
    {
        return $user !== null && $profile->user_id === $user->id;
    }

    private function shouldRecordClick(string $referralCode, string $sessionFingerprint, string $affiliateLinkId): bool
    {
        $windowMinutes = max(1, (int) config('diyar.affiliate.click_dedupe_window_minutes', 60));
        $cacheKey = "diyar:affiliate:click-dedupe:{$referralCode}:{$sessionFingerprint}";

        if (! Cache::add($cacheKey, true, now()->addMinutes($windowMinutes))) {
            return false;
        }

        return ! $this->isDuplicateClick($sessionFingerprint, $affiliateLinkId);
    }

    private function isDuplicateClick(string $sessionFingerprint, string $affiliateLinkId): bool
    {
        $windowMinutes = max(1, (int) config('diyar.affiliate.click_dedupe_window_minutes', 60));

        return AffiliateClick::query()
            ->where('session_fingerprint', $sessionFingerprint)
            ->where('affiliate_link_id', $affiliateLinkId)
            ->where('created_at', '>=', now()->subMinutes($windowMinutes))
            ->exists();
    }

    /**
     * @return array{
     *     affiliate_profile_id: string,
     *     affiliate_link_id: string,
     *     product_id: string,
     *     commission_rate_percent: string,
     *     expires_at: string
     * }
     */
    private function toPayload(AffiliateAttribution $attribution, AffiliateLink $link): array
    {
        return [
            'affiliate_profile_id' => $attribution->affiliate_profile_id,
            'affiliate_link_id' => $attribution->affiliate_link_id,
            'product_id' => $attribution->product_id,
            'commission_rate_percent' => number_format((float) $link->commission_rate_percent, 2, '.', ''),
            'expires_at' => $attribution->expires_at->toIso8601String(),
        ];
    }

    /**
     * @return array{
     *     affiliate_profile_id: string,
     *     affiliate_link_id: string,
     *     product_id: string,
     *     commission_rate_percent: string,
     *     expires_at: string
     * }
     */
    private function payloadFromRecord(AffiliateAttribution $record): array
    {
        $record->loadMissing('link');

        return [
            'affiliate_profile_id' => $record->affiliate_profile_id,
            'affiliate_link_id' => $record->affiliate_link_id,
            'product_id' => $record->product_id,
            'commission_rate_percent' => number_format((float) ($record->link?->commission_rate_percent ?? 0), 2, '.', ''),
            'expires_at' => $record->expires_at->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function storeInCache(string $sessionFingerprint, string $productId, array $payload): void
    {
        $ttl = max(1, now()->diffInSeconds(Carbon::parse($payload['expires_at'])));

        Cache::put($this->sessionCacheKey($sessionFingerprint, $productId), $payload, $ttl);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function storeInCacheForUser(string $userId, string $productId, array $payload): void
    {
        $ttl = max(1, now()->diffInSeconds(Carbon::parse($payload['expires_at'])));

        Cache::put($this->userCacheKey($userId, $productId), $payload, $ttl);
    }

    private function sessionCacheKey(string $sessionFingerprint, string $productId): string
    {
        return "diyar:affiliate:attribution:session:{$sessionFingerprint}:{$productId}";
    }

    private function userCacheKey(string $userId, string $productId): string
    {
        return "diyar:affiliate:attribution:user:{$userId}:{$productId}";
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function isPayloadValid(array $payload): bool
    {
        $expiresAt = $payload['expires_at'] ?? null;

        if (! is_string($expiresAt)) {
            return false;
        }

        return now()->lt($expiresAt);
    }
}
