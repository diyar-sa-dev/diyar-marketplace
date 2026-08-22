<?php

namespace App\Http\Requests\Affiliate;

use App\Enums\AffiliateTrafficSource;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
            'traffic_source' => ['nullable', 'string', 'max:32', Rule::in(AffiliateTrafficSource::values())],
            'referrer_url' => ['nullable', 'string', 'max:512'],
        ];
    }
}
