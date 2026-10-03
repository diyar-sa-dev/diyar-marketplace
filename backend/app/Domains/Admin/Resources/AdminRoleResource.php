<?php

namespace App\Domains\Admin\Resources;

use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Role */
class AdminRoleResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name->value,
            'label' => $this->label,
            'permissions' => AdminPermissionResource::collection($this->whenLoaded('permissions')),
        ];
    }
}
