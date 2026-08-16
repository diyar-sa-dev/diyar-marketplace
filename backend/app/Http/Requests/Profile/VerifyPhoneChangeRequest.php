<?php

namespace App\Http\Requests\Profile;

use App\Services\Identity\PhoneNormalizer;
use Illuminate\Foundation\Http\FormRequest;

class VerifyPhoneChangeRequest extends FormRequest
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
            'phone' => ['required', 'string', 'max:20'],
            'code' => ['required', 'string', 'digits:6'],
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
