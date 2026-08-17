<?php

namespace App\Http\Resources;

use App\Services\Returns\DTO\EffectiveReturnPolicy;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin EffectiveReturnPolicy */
class EffectiveReturnPolicyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var EffectiveReturnPolicy $policy */
        $policy = $this->resource;

        return $policy->toArray();
    }
}
