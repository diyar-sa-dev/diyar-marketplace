<?php

namespace App\Http\Requests\Returns;

use App\Enums\ReturnReason;
use App\Enums\ReturnShippingPaidBy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorReturnPolicyRequest extends FormRequest
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
            'returnable' => ['required', 'boolean'],
            'return_window_days' => ['required', 'integer', 'min:0', 'max:365'],
            'accepted_reasons' => ['required', 'array', 'min:1'],
            'accepted_reasons.*' => ['string', Rule::in(ReturnReason::values())],
            'requires_unused' => ['required', 'boolean'],
            'requires_evidence' => ['required', 'boolean'],
            'return_shipping_paid_by' => ['required', 'string', Rule::in(ReturnShippingPaidBy::values())],
            'shipping_refundable' => ['required', 'boolean'],
        ];
    }
}
