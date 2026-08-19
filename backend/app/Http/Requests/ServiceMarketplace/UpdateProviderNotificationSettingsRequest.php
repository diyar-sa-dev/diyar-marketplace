<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProviderNotificationSettingsRequest extends FormRequest
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
            'new_bookings' => ['sometimes', 'boolean'],
            'appointment_reminders' => ['sometimes', 'boolean'],
            'messages' => ['sometimes', 'boolean'],
            'new_reviews' => ['sometimes', 'boolean'],
        ];
    }
}
