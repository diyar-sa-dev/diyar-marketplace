<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class StoreProviderServiceRequest extends FormRequest
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
            'title' => ['required', 'string', 'min:3', 'max:255'],
            'starting_price' => ['required', 'numeric', 'min:0'],
            'duration_label' => ['nullable', 'string', 'max:255'],
            'service_type_label' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
            'service_category_id' => ['nullable', 'uuid'],
            'cover' => ['nullable', 'image', 'max:5120'],
        ];
    }
}
