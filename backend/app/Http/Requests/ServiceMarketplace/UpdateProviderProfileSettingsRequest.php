<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProviderProfileSettingsRequest extends FormRequest
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
            'specialty' => ['sometimes', 'string', 'min:2', 'max:255'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'work_areas' => ['sometimes', 'nullable', 'string', 'max:255'],
        ];
    }
}
