<?php

namespace App\Http\Requests\Returns;

use App\Enums\ReturnReason;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReturnRequest extends FormRequest
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
            'vendor_order_id' => ['required', 'uuid', 'exists:vendor_orders,id'],
            'reason' => ['required', 'string', Rule::in(ReturnReason::values())],
            'customer_note' => ['nullable', 'string', 'max:2000'],
            'evidence_provided' => ['nullable', 'boolean'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.order_item_id' => ['required', 'uuid', 'exists:order_items,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ];
    }
}
