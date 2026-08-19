<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class ProviderReviewResponseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->providerAccount !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'response' => ['required', 'string', 'min:2', 'max:2000'],
        ];
    }
}
