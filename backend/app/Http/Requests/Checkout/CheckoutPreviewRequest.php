<?php

namespace App\Http\Requests\Checkout;

use App\Enums\ShippingMethod;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CheckoutPreviewRequest extends FormRequest
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
            'shipping_address_id' => ['required', 'uuid', 'exists:addresses,id'],
            'vendor_delivery_selections' => ['required', 'array', 'min:1'],
            'vendor_delivery_selections.*.vendor_account_id' => ['required', 'uuid', 'exists:vendor_accounts,id'],
            'vendor_delivery_selections.*.method' => ['required', Rule::enum(ShippingMethod::class)],
        ];
    }
}
