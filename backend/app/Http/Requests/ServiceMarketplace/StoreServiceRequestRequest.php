<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequestRequest extends FormRequest
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
            'title' => ['nullable', 'string', 'max:160'],
            'description' => ['required', 'string', 'min:20', 'max:5000'],
            'category_ids' => ['required', 'array', 'min:1', 'max:5'],
            'category_ids.*' => ['required', 'uuid'],
            'service_id' => ['nullable', 'uuid'],
            'provider_account_id' => ['nullable', 'uuid'],
            'budget_min' => ['nullable', 'numeric', 'min:0'],
            'budget_max' => ['nullable', 'numeric', 'gte:budget_min'],
            'location' => ['nullable', 'string', 'max:255'],
            'reference_links' => ['nullable', 'array', 'max:10'],
            'reference_links.*' => ['nullable', 'url', 'max:2048'],
        ];
    }
}
