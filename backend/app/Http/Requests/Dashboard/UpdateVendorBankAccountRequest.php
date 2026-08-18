<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\SaudiBank;
use App\Support\Finance\IbanValidator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateVendorBankAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->vendorAccount !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'bank_code' => ['required', Rule::in(SaudiBank::values())],
            'beneficiary_name' => ['required', 'string', 'min:2', 'max:255'],
            'iban' => ['required', 'string', 'max:34'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $iban = $this->input('iban');
            if (! is_string($iban) || $iban === '') {
                return;
            }

            if (! IbanValidator::isValidSaudiIban($iban)) {
                $validator->errors()->add('iban', __('diyar.vendor.invalid_iban'));
            }
        });
    }
}
