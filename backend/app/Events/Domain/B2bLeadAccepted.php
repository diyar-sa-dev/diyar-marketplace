<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\B2bLead;
use App\Services\Notifications\NotificationIntent;
use App\Support\B2b\B2bNotificationSupport;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class B2bLeadAccepted implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly B2bLead $lead,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $this->lead->loadMissing(['company', 'user']);

        return new NotificationIntent(
            type: NotificationType::B2bLeadAccepted,
            recipients: array_filter([$this->lead->user]),
            payload: [
                'company_name' => $this->lead->company?->name,
                'project_type' => $this->lead->project_type,
                'action_url' => B2bNotificationSupport::customerLeadsUrl($this->lead->id),
            ],
            entityType: 'b2b_lead',
            entityId: $this->lead->id,
            dedupeKey: "b2b.lead_accepted:{$this->lead->id}",
        );
    }
}
