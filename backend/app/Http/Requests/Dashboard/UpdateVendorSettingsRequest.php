<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->vendorAccount !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $vendorAccountId = $this->user()?->vendorAccount?->id;

        return [
            'business_name' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:80',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('vendor_accounts', 'slug')->ignore($vendorAccountId),
                Rule::notIn(config('diyar.vendor.reserved_slugs', [])),
            ],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'support_phone' => ['sometimes', 'required', 'string', 'max:30', 'regex:/^(?:\+966|966|0)?5\d{8}$/'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'website_url' => ['sometimes', 'nullable', 'url', 'max:255'],
        ];
    }
}
