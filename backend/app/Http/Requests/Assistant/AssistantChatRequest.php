<?php

namespace App\Http\Requests\Assistant;

use Illuminate\Foundation\Http\FormRequest;

class AssistantChatRequest extends FormRequest
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
            'messages' => ['required', 'array', 'min:1', 'max:20'],
            'messages.*.role' => ['required', 'string', 'in:user,assistant'],
            'messages.*.content' => ['required', 'string', 'max:4000'],
            'messages.*.image' => [
                'nullable',
                'string',
                'max:6000000',
                'regex:/^data:image\\/(jpeg|jpg|png|webp);base64,[A-Za-z0-9+\\/=]+$/',
            ],
            'catalog_context' => ['nullable', 'string', 'max:12000'],
            'locale' => ['nullable', 'string', 'in:ar,en'],
        ];
    }
}
