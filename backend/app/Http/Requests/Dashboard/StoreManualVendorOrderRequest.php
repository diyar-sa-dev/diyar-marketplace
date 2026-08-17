<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\PaymentStatus;
use App\Enums\VendorOrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreManualVendorOrderRequest extends FormRequest
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
            'customer_name' => ['required', 'string', 'max:128'],
            'vendor_total' => ['required', 'numeric', 'min:0.01', 'max:9999999.99'],
            'items_count' => ['required', 'integer', 'min:1', 'max:100'],
            'status' => ['required', Rule::enum(VendorOrderStatus::class)],
            'payment_status' => ['required', Rule::in([
                PaymentStatus::Paid->value,
                PaymentStatus::Pending->value,
            ])],
            'customer_phone' => ['nullable', 'string', 'max:32'],
            'customer_email' => ['nullable', 'email', 'max:128'],
        ];
    }
}
