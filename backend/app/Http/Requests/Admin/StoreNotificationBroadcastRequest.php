<?php

namespace App\Http\Requests\Admin;

use App\Enums\NotificationBroadcastAudience;
use App\Enums\NotificationPriority;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreNotificationBroadcastRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:5000'],
            'category' => ['sometimes', 'string', 'max:32'],
            'channels' => ['required', 'array', 'min:1'],
            'channels.*' => ['required', 'string', Rule::in(['in_app', 'email', 'push'])],
            'audience_type' => ['required', 'string', Rule::enum(NotificationBroadcastAudience::class)],
            'audience_filter' => ['nullable', 'array'],
            'audience_filter.role' => ['required_if:audience_type,role', 'string', 'max:64'],
            'audience_filter.user_ids' => ['required_if:audience_type,selected_users', 'array', 'min:1'],
            'audience_filter.user_ids.*' => ['uuid'],
            'priority' => ['sometimes', 'string', Rule::enum(NotificationPriority::class)],
            'scheduled_at' => ['nullable', 'date'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ];
    }
}
