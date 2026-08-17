<?php

namespace App\Http\Requests\Payment;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SimulatePaymentRequest extends FormRequest
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
            'attempt_id' => ['required', 'uuid'],
            'outcome' => ['required', 'string', Rule::in(['success', 'failed', 'expired'])],
        ];
    }
}
