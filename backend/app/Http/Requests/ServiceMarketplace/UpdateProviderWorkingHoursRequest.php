<?php

namespace App\Http\Requests\ServiceMarketplace;

use App\Enums\Weekday;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateProviderWorkingHoursRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->providerAccount !== null;
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            foreach ($this->input('hours', []) as $index => $hour) {
                if ((bool) ($hour['is_closed'] ?? false)) {
                    continue;
                }

                $opensAt = $hour['opens_at'] ?? null;
                $closesAt = $hour['closes_at'] ?? null;

                if ($opensAt === null || $closesAt === null || $opensAt >= $closesAt) {
                    $validator->errors()->add(
                        "hours.{$index}.opens_at",
                        __('diyar.services.settings.invalid_working_hours'),
                    );
                }
            }
        });
    }
}
