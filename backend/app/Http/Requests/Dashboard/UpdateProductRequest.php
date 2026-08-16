<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\AvailabilityMode;
use App\Enums\ProductType;
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
            'vendor_account_id' => ['prohibited'],
            'user_id' => ['prohibited'],
        ];
    }
}
