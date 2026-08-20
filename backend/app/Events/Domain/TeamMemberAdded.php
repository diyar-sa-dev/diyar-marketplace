<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\User;
use App\Models\VendorTeamMember;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class TeamMemberAdded implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly VendorTeamMember $member,
        public readonly User $user,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->member->loadMissing('vendorAccount');

        return new NotificationIntent(
            type: NotificationType::TeamMemberAdded,
            recipients: [$this->user],
            payload: [
                'store_name' => (string) ($this->member->vendorAccount?->business_name ?? ''),
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/dashboard/vendor',
            ],
            entityType: 'team_member',
            entityId: $this->member->id,
            dedupeKey: "team.member_added:{$this->member->id}",
        );
    }
}
