<?php

namespace App\Http\Requests\Profile;

use App\Services\Identity\PhoneNormalizer;
use Illuminate\Foundation\Http\FormRequest;

class RequestPhoneChangeRequest extends FormRequest
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
            'phone' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, \Closure $fail) {
                if (PhoneNormalizer::normalize((string) $value) === null) {
                    $fail(__('diyar.registration.invalid_phone'));
                }
            }],
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
