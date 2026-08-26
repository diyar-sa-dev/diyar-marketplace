<?php

namespace App\Http\Requests\Admin;

use App\Enums\ChatMessageReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateChatReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => [
                'required',
                Rule::enum(ChatMessageReportStatus::class),
                Rule::notIn([ChatMessageReportStatus::Pending->value]),
            ],
            'resolution_note' => ['nullable', 'string', 'max:1000'],
            'action_taken' => [
                'nullable',
                'string',
                Rule::in(['none', 'closed', 'delete_message', 'warn_sender', 'suspend_account', 'escalate']),
            ],
        ];
    }
}
