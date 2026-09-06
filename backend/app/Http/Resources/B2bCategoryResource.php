<?php

namespace App\Http\Resources;

use App\Models\B2bCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bCategory */
class B2bCategoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'description' => $this->description,
            'published_companies_count' => $this->when(
                isset($this->published_companies_count),
                fn () => (int) $this->published_companies_count,
            ),
        ];
    }
}
