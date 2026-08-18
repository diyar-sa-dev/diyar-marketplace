<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\BusinessEntityType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorLegalProfileRequest extends FormRequest
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
        return [
            'entity_type' => ['required', Rule::in(BusinessEntityType::values())],
            'commercial_registration_number' => ['required', 'string', 'regex:/^\d{10}$/'],
            'tax_number' => ['nullable', 'string', 'regex:/^\d{15}$/'],
        ];
    }
}
