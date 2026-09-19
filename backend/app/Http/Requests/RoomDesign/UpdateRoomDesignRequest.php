<?php

namespace App\Http\Requests\RoomDesign;

use Illuminate\Foundation\Http\FormRequest;

class UpdateRoomDesignRequest extends FormRequest
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
            'expected_version' => ['required', 'integer', 'min:1'],
            'document' => ['required', 'array'],
        ];
    }
}
