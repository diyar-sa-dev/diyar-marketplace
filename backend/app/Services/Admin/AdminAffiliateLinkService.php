<?php

namespace App\Services\Admin;

use App\Models\AffiliateLink;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class AdminAffiliateLinkService
{
    public function __construct(
        private readonly AdminAuditService $audit,
    ) {}

    public function disable(AffiliateLink $link, User $actor, ?string $reason = null): AffiliateLink
    {
        if (! $link->is_active) {
            return $link;
        }

        return DB::transaction(function () use ($link, $actor, $reason): AffiliateLink {
            $before = ['is_active' => true];
            $link->update(['is_active' => false]);

            $this->audit->record(
                actor: $actor,
                action: 'affiliate_link.disable',
                resource: $link,
                before: $before,
                after: ['is_active' => false],
                reason: $reason,
            );

            return $link->fresh(['profile', 'product']);
        });
    }
}
