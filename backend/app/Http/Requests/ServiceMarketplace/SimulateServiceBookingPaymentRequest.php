<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class SimulateServiceBookingPaymentRequest extends FormRequest
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
            'outcome' => ['required', 'in:paid,failed'],
        ];
    }
}
