<?php

namespace App\Http\Resources;

use App\Models\B2bLead;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bLead */
class PartnerB2bLeadResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var MediaUploadService $media */
        $media = app(MediaUploadService::class);

        return [
            'id' => $this->id,
            'project_type' => $this->project_type,
            'estimated_quantity' => $this->estimated_quantity,
            'details' => $this->details,
            'budget_range' => $this->budget_range->value,
            'status' => $this->status instanceof \BackedEnum ? $this->status->value : (string) $this->status,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
            'requester' => $this->when(
                $this->relationLoaded('user') && $this->user !== null,
                fn () => [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'phone' => $this->user->phone,
                    'email' => $this->user->email,
                    'avatar_url' => $media->url($this->user->avatar_path),
                ],
            ),
        ];
    }
}
