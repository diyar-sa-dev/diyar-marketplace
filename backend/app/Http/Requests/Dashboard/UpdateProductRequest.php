<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\AvailabilityMode;
use App\Enums\ProductType;
use App\Enums\ReturnReason;
use App\Enums\ReturnShippingPaidBy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'category_id' => ['sometimes', 'uuid', 'exists:categories,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'sale_price' => ['sometimes', 'numeric', 'min:0'],
            'compare_price' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'promotion_ends_at' => ['sometimes', 'nullable', 'date', 'after:now'],
            'width' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'height' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'depth' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'materials' => ['sometimes', 'nullable', 'array'],
            'materials.*' => ['string', 'max:255'],
            'warranty' => ['sometimes', 'nullable', 'string', 'max:255'],
            'product_type' => ['sometimes', 'string', Rule::enum(ProductType::class)],
            'availability_mode' => ['sometimes', 'string', Rule::enum(AvailabilityMode::class)],
            'expected_available_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
            'colors' => ['sometimes', 'array'],
            'colors.*.name' => ['required', 'string', 'max:100'],
            'colors.*.hex_code' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'return_policy_override_enabled' => ['sometimes', 'boolean'],
            'returnable' => ['sometimes', 'nullable', 'boolean'],
            'return_window_days' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:365'],
            'return_accepted_reasons' => ['sometimes', 'nullable', 'array', 'min:1'],
            'return_accepted_reasons.*' => ['string', Rule::in(ReturnReason::values())],
            'return_requires_unused' => ['sometimes', 'nullable', 'boolean'],
            'return_requires_evidence' => ['sometimes', 'nullable', 'boolean'],
            'return_shipping_paid_by' => ['sometimes', 'nullable', 'string', Rule::in(ReturnShippingPaidBy::values())],
            'return_shipping_refundable' => ['sometimes', 'nullable', 'boolean'],
            'vendor_account_id' => ['prohibited'],
            'user_id' => ['prohibited'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'expected_available_at' => __('validation.attributes.expected_available_at'),
        ];
    }
}
