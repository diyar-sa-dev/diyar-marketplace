<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
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
            'quantity' => ['required', 'integer', 'min:1', 'max:'.$max],
        ];
    }
}
