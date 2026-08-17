<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCartItemRequest extends FormRequest
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
        $max = max(1, (int) config('diyar.cart.max_quantity_per_item', 99));

        return [
            'product_id' => ['required', 'uuid', Rule::exists('products', 'id')],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:'.$max],
            'color_name' => ['sometimes', 'nullable', 'string', 'max:64'],
            'color_hex' => ['sometimes', 'nullable', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (! $this->has('quantity')) {
            $this->merge(['quantity' => 1]);
        }
    }
}
