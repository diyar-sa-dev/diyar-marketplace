<?php

namespace App\Events\Domain;

use App\Domains\B2b\Support\B2bNotificationSupport;
use App\Domains\Notifications\Contracts\TriggersNotification;
use App\Domains\Notifications\Services\NotificationIntent;
use App\Enums\NotificationType;
use App\Models\B2bLead;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class B2bLeadReceived implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly B2bLead $lead,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->lead->loadMissing(['company', 'user']);
        $company = $this->lead->company;
        $owner = $company !== null ? B2bNotificationSupport::resolveOwner($company) : null;

        return new NotificationIntent(
            type: NotificationType::B2bLeadReceived,
            recipients: array_filter([$owner]),
            payload: [
                'company_name' => $company?->name,
                'project_type' => $this->lead->project_type,
                'requester_name' => $this->lead->user?->name,
                'action_url' => $company !== null
                    ? B2bNotificationSupport::partnerDashboardUrl($company)
                    : null,
            ],
            entityType: 'b2b_lead',
            entityId: $this->lead->id,
            dedupeKey: "b2b.lead_received:{$this->lead->id}",
        );
    }
}
