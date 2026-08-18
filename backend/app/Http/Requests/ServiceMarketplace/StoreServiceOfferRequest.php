<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceOfferRequest extends FormRequest
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
            'proposed_price' => ['required', 'numeric', 'min:1'],
            'currency' => ['nullable', 'string', 'size:3'],
            'duration_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'message' => ['nullable', 'string', 'max:5000'],
            'expires_at' => ['nullable', 'date', 'after:now'],
            'quotation' => ['nullable', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf'],
        ];
    }
}
