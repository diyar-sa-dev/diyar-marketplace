<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\CouponScopeType;
use App\Enums\VendorCouponType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVendorCouponRequest extends FormRequest
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
        $type = $this->input('type', VendorCouponType::Percentage->value);

        return [
            'code' => ['required', 'string', 'max:64'],
            'type' => ['sometimes', Rule::enum(VendorCouponType::class)],
            'scope_type' => ['sometimes', Rule::enum(CouponScopeType::class)],
            'value' => [Rule::requiredIf($type === VendorCouponType::Percentage->value), 'integer', "min:{$min}", "max:{$max}"],
            'fixed_amount' => [Rule::requiredIf($type === VendorCouponType::Fixed->value), 'numeric', 'min:0.01'],
            'minimum_order' => ['nullable', 'numeric', 'min:0'],
            'maximum_discount' => ['nullable', 'numeric', 'min:0'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_user' => ['nullable', 'integer', 'min:1'],
            'stackable' => ['sometimes', 'boolean'],
            'exclusive_group' => ['nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
