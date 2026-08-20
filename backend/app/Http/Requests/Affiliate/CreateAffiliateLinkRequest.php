<?php

namespace App\Http\Requests\Affiliate;

use Illuminate\Foundation\Http\FormRequest;

class CreateAffiliateLinkRequest extends FormRequest
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
            'name' => ['required', 'string', 'max:120'],
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'commission_rate_percent' => ['nullable', 'numeric', 'min:0.01', 'max:100'],
            'campaign_name' => ['nullable', 'string', 'max:120'],
            'source' => ['nullable', 'string', 'max:60'],
        ];
    }
}
