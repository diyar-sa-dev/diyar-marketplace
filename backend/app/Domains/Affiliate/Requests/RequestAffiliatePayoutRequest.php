<?php

namespace App\Domains\Affiliate\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RequestAffiliatePayoutRequest extends FormRequest
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
            'amount' => ['required', 'numeric', 'min:0.01'],
        ];
    }
}
