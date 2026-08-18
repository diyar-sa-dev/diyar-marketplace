<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\Media\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin User */
class UserResource extends JsonResource
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
            'name' => $this->name,
            'phone' => $this->phone,
            'email' => $this->email,
            'bio' => $this->bio,
            'avatar_url' => $media->url($this->avatar_path),
            'preferences' => $this->preferences ?? [],
            'status' => $this->status->value,
            'phone_verified_at' => $this->phone_verified_at?->toIso8601String(),
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name->value,
                'label' => $role->label,
                'status' => $role->pivot->status->value,
            ])),
            'vendor_account' => $this->whenLoaded('vendorAccount', fn () => $this->vendorAccount !== null ? [
                'id' => $this->vendorAccount->id,
                'slug' => $this->vendorAccount->slug,
                'store_name' => $this->vendorAccount->business_name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
