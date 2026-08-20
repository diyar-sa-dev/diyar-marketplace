<?php

namespace App\Http\Requests\Affiliate;

use Illuminate\Foundation\Http\FormRequest;

class UpsertProductAffiliateSettingsRequest extends FormRequest
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
            'enabled' => ['sometimes', 'boolean'],
            'commission_min_percent' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'commission_max_percent' => ['required', 'numeric', 'min:0.01', 'max:100'],
            'commission_rate_percent' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
        ];
    }
}
