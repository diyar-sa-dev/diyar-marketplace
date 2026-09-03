<?php

namespace App\Http\Requests\Affiliate;

use App\Support\Finance\IbanValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateAffiliateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $iban = $this->input('payout_iban');
        if (is_string($iban) && $iban !== '') {
            $this->merge([
                'payout_iban' => IbanValidator::normalize($iban),
            ]);
        }
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $iban = $this->input('payout_iban');
            if (! is_string($iban) || $iban === '') {
                return;
            }

            if (! IbanValidator::isValidSaudiIban($iban)) {
                $validator->errors()->add('payout_iban', __('diyar.vendor.invalid_iban'));
            }
        });
    }
}
