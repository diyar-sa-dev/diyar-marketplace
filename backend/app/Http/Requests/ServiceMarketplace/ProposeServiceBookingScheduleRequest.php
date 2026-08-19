<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class ProposeServiceBookingScheduleRequest extends FormRequest
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
            'proposed_scheduled_date' => ['required', 'date', 'after_or_equal:today'],
            'proposed_scheduled_time' => ['required', 'date_format:H:i'],
            'provider_notes' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'proposed_scheduled_date.required' => __('diyar.services.bookings.schedule_required'),
            'proposed_scheduled_date.date' => __('diyar.services.bookings.invalid_schedule'),
            'proposed_scheduled_date.after_or_equal' => __('diyar.services.bookings.proposed_date_past'),
            'proposed_scheduled_time.required' => __('diyar.services.bookings.schedule_required'),
            'proposed_scheduled_time.date_format' => __('diyar.services.bookings.proposed_time_invalid'),
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'proposed_scheduled_date' => __('validation.attributes.proposed_scheduled_date'),
            'proposed_scheduled_time' => __('validation.attributes.proposed_scheduled_time'),
            'provider_notes' => __('validation.attributes.provider_notes'),
        ];
    }
}
