<?php

namespace App\Http\Requests\Affiliate;

use App\Enums\AffiliateTrafficSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'traffic_source' => ['nullable', 'string', 'max:32', Rule::in(AffiliateTrafficSource::values())],
            'referrer_url' => ['nullable', 'string', 'max:512'],
        ];
    }
}
