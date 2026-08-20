<?php

namespace App\Http\Requests\Affiliate;

use Illuminate\Foundation\Http\FormRequest;

class TrackAffiliateClickRequest extends FormRequest
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
            'ref' => ['required', 'string', 'max:32'],
            'product_id' => ['required', 'uuid', 'exists:products,id'],
            'session_fingerprint' => ['required', 'string', 'max:64'],
        ];
    }
}
