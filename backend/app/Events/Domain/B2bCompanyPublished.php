<?php

namespace App\Events\Domain;

use App\Contracts\Notifications\TriggersNotification;
use App\Enums\NotificationType;
use App\Models\B2bCompany;
use App\Services\Notifications\NotificationIntent;
use App\Support\B2b\B2bNotificationSupport;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class B2bCompanyPublished implements TriggersNotification
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly B2bCompany $company,
    ) {}

    public function toNotificationIntent(): NotificationIntent
    {
        $owner = B2bNotificationSupport::resolveOwner($this->company);

        return new NotificationIntent(
            type: NotificationType::B2bCompanyPublished,
            recipients: array_filter([$owner]),
            payload: [
                'company_name' => $this->company->name,
                'action_url' => B2bNotificationSupport::partnerDashboardUrl($this->company),
            ],
            entityType: 'b2b_company',
            entityId: $this->company->id,
            dedupeKey: "b2b.company_published:{$this->company->id}",
        );
    }
}
