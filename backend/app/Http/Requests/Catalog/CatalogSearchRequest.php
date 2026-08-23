<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CatalogSearchRequest extends FormRequest
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
            'q' => ['nullable', 'string', 'max:120'],
            'type' => ['nullable', Rule::in(['all', 'products', 'services'])],
            'category_slug' => ['nullable', 'string', 'max:120'],
            'vendor_id' => ['nullable', 'uuid'],
            'vendor_slug' => ['nullable', 'string', 'max:120'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'gte:min_price'],
            'color' => ['nullable', 'string', 'max:60'],
            'colors' => ['nullable', 'string', 'max:300'],
            'material' => ['nullable', 'string', 'max:60'],
            'availability_mode' => ['nullable', Rule::in(['in_stock', 'out_of_stock', 'preorder'])],
            'discounted' => ['nullable', 'boolean'],
            'sort' => ['nullable', Rule::in([
                '-created_at',
                'created_at',
                'price',
                '-price',
                'name',
                '-name',
                '-discount',
                'discount',
                '-popular',
                'popular',
                'latest',
                'rating',
            ])],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedFilters(): array
    {
        $validated = $this->validated();

        if (isset($validated['q'])) {
            $validated['q'] = preg_replace('/\s+/u', ' ', trim((string) $validated['q'])) ?: null;
        }

        return $validated;
    }
}
