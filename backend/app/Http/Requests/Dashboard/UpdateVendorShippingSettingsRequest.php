<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateVendorShippingSettingsRequest extends FormRequest
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
            'carrier_enabled' => ['required', 'boolean'],
            'carrier_flat_rate' => ['nullable', 'numeric', 'min:0'],
            'carrier_free_shipping_enabled' => ['required', 'boolean'],
            'carrier_free_shipping_threshold' => ['nullable', 'numeric', 'min:0'],
            'pickup_enabled' => ['required', 'boolean'],
            'pickup_location_label' => ['nullable', 'string', 'max:255'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $carrier = (bool) $this->input('carrier_enabled');
            $pickup = (bool) $this->input('pickup_enabled');

            if (! $carrier && ! $pickup) {
                $validator->errors()->add('carrier_enabled', __('diyar.shipping.at_least_one_method'));
            }

            if ($carrier && $this->input('carrier_flat_rate') === null) {
                $validator->errors()->add('carrier_flat_rate', __('diyar.shipping.carrier_rate_required'));
            }

            if ((bool) $this->input('carrier_free_shipping_enabled')
                && $this->input('carrier_free_shipping_threshold') === null) {
                $validator->errors()->add('carrier_free_shipping_threshold', __('diyar.shipping.free_threshold_required'));
            }

            if ($pickup && ! filled($this->input('pickup_location_label'))) {
                $validator->errors()->add('pickup_location_label', __('diyar.shipping.pickup_label_required'));
            }
        });
    }
}
