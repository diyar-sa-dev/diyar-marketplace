<?php

namespace App\Http\Resources;

use App\Models\ProviderWorkPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProviderWorkPolicy */
class ProviderWorkPolicyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'policy_enabled' => (bool) $this->policy_enabled,
            'initial_delivery_days' => (int) $this->initial_delivery_days,
            'free_revisions_included' => (int) $this->free_revisions_included,
            'timeline_by_project_scope' => (bool) $this->timeline_by_project_scope,
            'cancellation_notice_hours' => $this->cancellation_notice_hours,
            'custom_terms' => array_values($this->custom_terms ?? []),
        ];
    }
}
