<?php

namespace App\Http\Requests\Chat;

use App\Enums\ConversationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateConversationRequest extends FormRequest
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
            'type' => ['required', Rule::enum(ConversationType::class)],
            'subject' => ['nullable', 'string', 'max:255'],
            'context_type' => ['nullable', 'string', 'max:64'],
            'context_id' => ['nullable', 'uuid'],
            'vendor_account_id' => ['nullable', 'uuid', 'required_if:type,customer_vendor'],
            'provider_account_id' => ['nullable', 'uuid', 'required_if:type,customer_provider'],
            'customer_user_id' => ['nullable', 'uuid'],
        ];
    }
}
