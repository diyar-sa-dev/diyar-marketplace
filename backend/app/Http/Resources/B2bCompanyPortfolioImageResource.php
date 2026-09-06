<?php

namespace App\Http\Resources;

use App\Models\B2bCompanyPortfolioImage;
use App\Support\Media\CmsImageUrl;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bCompanyPortfolioImage */
class B2bCompanyPortfolioImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => CmsImageUrl::resolve($this->image_path),
            'sort_order' => (int) $this->sort_order,
        ];
    }
}
