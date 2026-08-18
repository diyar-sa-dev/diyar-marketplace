<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\Weekday;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorWorkingHoursRequest extends FormRequest
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
            'hours' => ['required', 'array', 'size:7'],
            'hours.*.day' => ['required', Rule::in(Weekday::values())],
            'hours.*.is_closed' => ['required', 'boolean'],
            'hours.*.opens_at' => ['nullable', 'date_format:H:i'],
            'hours.*.closes_at' => ['nullable', 'date_format:H:i'],
            'hours.*.closes_next_day' => ['sometimes', 'boolean'],
        ];
    }
}
