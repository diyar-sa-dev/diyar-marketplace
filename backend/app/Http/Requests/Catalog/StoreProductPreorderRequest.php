<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreProductPreorderRequest extends FormRequest
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
            'selected_color' => ['nullable', 'array'],
            'selected_color.name' => ['nullable', 'string', 'max:100'],
            'selected_color.hex_code' => ['nullable', 'string', 'max:20'],
        ];
    }
}
