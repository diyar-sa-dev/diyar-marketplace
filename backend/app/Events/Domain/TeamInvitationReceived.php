<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\VendorTeamMember;
use App\Services\Notifications\NotificationIntent;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class TeamInvitationReceived implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly VendorTeamMember $member,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->member->loadMissing(['vendorAccount', 'user']);

        return new NotificationIntent(
            type: NotificationType::TeamInvitation,
            recipients: array_filter([$this->member->user]),
            payload: [
                'store_name' => (string) ($this->member->vendorAccount?->business_name ?? ''),
                'role' => (string) $this->member->role->value,
                'action_url' => rtrim((string) config('diyar.frontend_url'), '/').'/team/invite/'.$this->member->invite_token,
            ],
            entityType: 'team_member',
            entityId: $this->member->id,
            dedupeKey: "team.invitation:{$this->member->id}",
        );
    }
}
