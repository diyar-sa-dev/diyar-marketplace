<?php

namespace App\Services\Affiliate;

use App\Enums\AffiliateProfileStatus;
use App\Models\AffiliateLink;
use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class AffiliateProfileService
{
    public function resolveOrCreateForUser(User $user): AffiliateProfile
    {
        $existing = AffiliateProfile::query()->where('user_id', $user->id)->first();

        if ($existing !== null) {
            return $existing;
        }

        return AffiliateProfile::query()->create([
            'user_id' => $user->id,
            'referral_code' => $this->generateReferralCode(),
            'status' => AffiliateProfileStatus::Active,
            'display_name' => $user->name,
        ]);
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    public function updateSettings(AffiliateProfile $profile, array $settings): AffiliateProfile
    {
        $profile->update(array_filter([
            'display_name' => $settings['display_name'] ?? null,
            'payout_account_holder' => $settings['payout_account_holder'] ?? null,
            'payout_iban' => $settings['payout_iban'] ?? null,
            'payout_bank_code' => $settings['payout_bank_code'] ?? null,
            'payout_bank_name' => $settings['payout_bank_name'] ?? null,
            'social_links' => $settings['social_links'] ?? null,
        ], fn ($value) => $value !== null));

        return $profile->fresh();
    }

    public function assertDashboardAccess(AffiliateProfile $profile): void
    {
        if ($profile->status === AffiliateProfileStatus::Suspended) {
            throw new HttpException(403, __('diyar.affiliate.profile_suspended'));
        }
    }

    public function assertCanCreateLinks(AffiliateProfile $profile): void
    {
        $this->assertDashboardAccess($profile);

        if ($profile->status !== AffiliateProfileStatus::Active) {
            throw new HttpException(422, __('diyar.affiliate.profile_not_active'));
        }
    }

    public function generateReferralCode(): string
    {
        do {
            $code = strtoupper(Str::random(8));
        } while (
            AffiliateProfile::query()->where('referral_code', $code)->exists()
            || AffiliateLink::query()->where('referral_code', $code)->exists()
        );

        return $code;
    }
}
