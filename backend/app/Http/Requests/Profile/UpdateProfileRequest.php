<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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
        $userId = $this->user()?->id;

        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes',
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],
            'phone' => ['prohibited'],
            'password' => ['prohibited'],
            'status' => ['prohibited'],
            'avatar_path' => ['prohibited'],
            'phone_verified_at' => ['prohibited'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'preferences' => ['sometimes', 'nullable', 'array'],
        ];
    }
}
