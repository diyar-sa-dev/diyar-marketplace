<?php

namespace App\Http\Requests\Affiliate;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAffiliateSettingsRequest extends FormRequest
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
            'display_name' => ['nullable', 'string', 'max:120'],
            'payout_account_holder' => ['nullable', 'string', 'max:120'],
            'payout_iban' => ['nullable', 'string', 'max:34'],
            'payout_bank_code' => ['nullable', 'string', 'in:snb,alrajhi,riyad,bsf'],
            'payout_bank_name' => ['nullable', 'string', 'max:120'],
            'social_links' => ['nullable', 'array'],
            'social_links.*' => ['nullable', 'url', 'max:255'],
        ];
    }
}
