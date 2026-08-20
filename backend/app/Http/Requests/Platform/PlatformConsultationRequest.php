<?php

namespace App\Http\Requests\Platform;

use App\Services\Identity\PhoneNormalizer;
use Illuminate\Foundation\Http\FormRequest;

class PlatformConsultationRequest extends FormRequest
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
            'name' => ['required', 'string', 'min:2', 'max:120'],
            'phone' => ['required', 'string', 'max:20', function (string $attribute, mixed $value, \Closure $fail) {
                if (PhoneNormalizer::normalize((string) $value) === null) {
                    $fail(__('diyar.platform.invalid_phone'));
                }
            }],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'message' => ['required', 'string', 'min:10', 'max:2000'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
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
