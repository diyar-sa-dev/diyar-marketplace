<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorCouponRequest extends FormRequest
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
        $min = (int) config('diyar.coupons.percentage_min', 5);
        $max = (int) config('diyar.coupons.percentage_max', 90);

        return [
            'code' => ['sometimes', 'string', 'max:64'],
            'value' => ['sometimes', 'nullable', 'integer', "min:{$min}", "max:{$max}"],
            'fixed_amount' => ['sometimes', 'nullable', 'numeric', 'min:0.01'],
            'minimum_order' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'maximum_discount' => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'starts_at' => ['sometimes', 'nullable', 'date'],
            'ends_at' => ['sometimes', 'nullable', 'date'],
            'usage_limit' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'stackable' => ['sometimes', 'boolean'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
