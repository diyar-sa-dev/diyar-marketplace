<?php

namespace App\Domains\Identity\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ResendTwoFactorRequest extends FormRequest
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
            'challenge_id' => ['required', 'uuid'],
        ];
    }
}
