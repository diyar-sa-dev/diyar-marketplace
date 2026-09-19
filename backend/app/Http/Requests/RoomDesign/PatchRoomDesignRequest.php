<?php

namespace App\Http\Requests\RoomDesign;

use Illuminate\Foundation\Http\FormRequest;

class PatchRoomDesignRequest extends FormRequest
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
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }
}
