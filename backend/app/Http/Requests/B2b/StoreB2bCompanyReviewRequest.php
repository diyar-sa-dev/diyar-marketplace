<?php

namespace App\Http\Requests\B2b;

use Illuminate\Foundation\Http\FormRequest;

class StoreB2bCompanyReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'b2b_lead_id' => ['required', 'uuid'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
