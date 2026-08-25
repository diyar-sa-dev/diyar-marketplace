<?php

namespace App\Http\Resources;

use App\Models\B2bLead;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bLead */
class B2bLeadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'project_type' => $this->project_type,
            'estimated_quantity' => $this->estimated_quantity,
            'details' => $this->details,
            'budget_range' => $this->budget_range->value,
            'status' => $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'company' => $this->when(
                $this->relationLoaded('company') && $this->company !== null,
                fn () => new B2bCompanyCardResource($this->company),
            ),
            'user' => $this->when(
                $request->is('api/v1/admin/*') && $this->relationLoaded('user') && $this->user !== null,
                fn () => [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                ],
            ),
        ];
    }
}
