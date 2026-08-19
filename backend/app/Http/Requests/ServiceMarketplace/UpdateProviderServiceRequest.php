<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProviderServiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'min:3', 'max:255'],
            'starting_price' => ['sometimes', 'numeric', 'min:0'],
            'duration_label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'service_type_label' => ['sometimes', 'nullable', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
            'service_category_id' => ['sometimes', 'nullable', 'uuid'],
            'cover' => ['sometimes', 'nullable', 'image', 'max:5120'],
        ];
    }
}
