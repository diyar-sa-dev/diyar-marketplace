<?php

namespace App\Http\Requests\Affiliate;

use Illuminate\Foundation\Http\FormRequest;

class ResolveAffiliateReferralRequest extends FormRequest
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
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'ref' => ['nullable', 'string', 'max:32'],
            'session_fingerprint' => ['nullable', 'string', 'max:64'],
        ];
    }
}
