<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UpdateNotificationPreferencesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'channels' => ['sometimes', 'array'],
            'channels.email' => ['sometimes', 'boolean'],
            'channels.push' => ['sometimes', 'boolean'],
            'preferences' => ['sometimes', 'array'],
            'preferences.*' => ['array'],
            'preferences.*.*' => ['boolean'],
            'category_enabled' => ['sometimes', 'array'],
            'category_enabled.*' => ['boolean'],
        ];
    }
}
