<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;

class SubmitPaymentRequest extends FormRequest
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
            'session_id' => ['required', 'string', 'max:128'],
            'idempotency_key' => ['required', 'string', 'max:128'],
            'payment_method' => ['nullable', 'string', 'max:64'],
        ];
    }
}
