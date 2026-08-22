<?php

namespace App\Services\Admin;

use App\Enums\AffiliateProfileStatus;
use App\Models\AffiliateProfile;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AdminAffiliateProfileService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function suspend(AffiliateProfile $profile, User $actor, ?string $reason = null): AffiliateProfile
    {
        return $this->setStatus($profile, $actor, AffiliateProfileStatus::Suspended, 'affiliate_profile.suspend', $reason);
    }

    public function activate(AffiliateProfile $profile, User $actor, ?string $reason = null): AffiliateProfile
    {
        return $this->setStatus($profile, $actor, AffiliateProfileStatus::Active, 'affiliate_profile.activate', $reason);
    }

    private function setStatus(
        AffiliateProfile $profile,
        User $actor,
        AffiliateProfileStatus $status,
        string $action,
        ?string $reason,
    ): AffiliateProfile {
        if ($profile->status === $status) {
            return $profile;
        }

        return DB::transaction(function () use ($profile, $actor, $status, $action, $reason): AffiliateProfile {
            $before = ['status' => $profile->status->value];
            $profile->status = $status;
            $profile->save();

            $this->audit->record(
                actor: $actor,
                action: $action,
                resource: $profile,
                before: $before,
                after: ['status' => $profile->status->value],
                reason: $reason,
            );

            return $profile->fresh(['user']);
        });
    }
}
