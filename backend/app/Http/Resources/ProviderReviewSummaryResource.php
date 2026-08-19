<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin array{average_rating: ?float, review_count: int, distribution: list<array{stars: int, count: int, percentage: int}>} */
class ProviderReviewSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'average_rating' => $this->resource['average_rating'],
            'review_count' => $this->resource['review_count'],
            'distribution' => $this->resource['distribution'],
        ];
    }
}
