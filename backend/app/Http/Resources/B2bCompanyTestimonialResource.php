<?php

namespace App\Http\Resources;

use App\Models\B2bCompanyTestimonial;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin B2bCompanyTestimonial */
class B2bCompanyTestimonialResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author_name' => $this->author_name,
            'author_role' => $this->author_role,
            'rating' => (int) $this->rating,
            'content' => $this->content,
        ];
    }
}
