<?php

namespace App\Http\Requests\Profile;

use App\Enums\AddressType;
use App\Services\Identity\PhoneNormalizer;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAddressRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'label' => ['sometimes', 'required', 'string', 'max:100'],
            'type' => ['sometimes', 'required', 'string', Rule::in(AddressType::values())],
            'recipient_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone' => ['sometimes', 'required', 'string', 'max:20', function (string $attribute, mixed $value, \Closure $fail) {
                if (PhoneNormalizer::normalize((string) $value) === null) {
                    $fail(__('diyar.registration.invalid_phone'));
                }
            }],
            'city' => ['sometimes', 'nullable', 'string', 'max:100'],
            'district' => ['sometimes', 'nullable', 'string', 'max:100'],
            'street' => ['sometimes', 'nullable', 'string', 'max:255'],
            'building' => ['sometimes', 'nullable', 'string', 'max:50'],
            'apartment' => ['sometimes', 'nullable', 'string', 'max:50'],
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $normalized = PhoneNormalizer::normalize($this->input('phone'));
            if ($normalized !== null) {
                $this->merge(['phone' => $normalized]);
            }
        }
    }
}
