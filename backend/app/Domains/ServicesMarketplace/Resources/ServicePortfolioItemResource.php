<?php

namespace App\Domains\ServicesMarketplace\Resources;

use App\Domains\ServicesMarketplace\Support\ServiceMarketplacePresenter;
use App\Models\ServicePortfolioItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ServicePortfolioItem */
class ServicePortfolioItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $presenter = app(ServiceMarketplacePresenter::class);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'media_url' => $presenter->mediaUrl($this->media_path),
            'sort_order' => $this->sort_order,
        ];
    }
}
