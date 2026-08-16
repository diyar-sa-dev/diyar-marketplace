<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\AvailabilityMode;
use App\Enums\ProductType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
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
        $maxKb = (int) config('diyar_media.max_upload_kb', 5120);

        return [
            'category_id' => ['required', 'uuid', 'exists:categories,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'sale_price' => ['required', 'numeric', 'min:0'],
            'compare_price' => ['nullable', 'numeric', 'min:0'],
            'width' => ['nullable', 'numeric', 'min:0'],
            'height' => ['nullable', 'numeric', 'min:0'],
            'depth' => ['nullable', 'numeric', 'min:0'],
            'materials' => ['nullable', 'array'],
            'materials.*' => ['string', 'max:255'],
            'warranty' => ['nullable', 'string', 'max:255'],
            'product_type' => ['sometimes', 'string', Rule::enum(ProductType::class)],
            'availability_mode' => ['sometimes', 'string', Rule::enum(AvailabilityMode::class)],
            'expected_available_at' => ['sometimes', 'nullable', 'date', 'after_or_equal:today'],
            'stock_quantity' => ['required', 'integer', 'min:0'],
            'colors' => ['sometimes', 'array'],
            'colors.*.name' => ['required', 'string', 'max:100'],
            'colors.*.hex_code' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'images' => ['sometimes', 'array', 'max:5'],
            'images.*' => ['file', 'max:'.$maxKb, 'mimes:jpg,jpeg,png,webp'],
            'vendor_account_id' => ['prohibited'],
            'user_id' => ['prohibited'],
        ];
    }
}
