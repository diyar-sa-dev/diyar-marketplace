<?php

namespace App\Http\Requests\TryInRoom;

use Illuminate\Foundation\Http\FormRequest;

class StoreTryInRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $maxKb = (int) config('diyar.try_in_room.max_upload_kb', 8192);

        return [
            'photo' => ['required', 'file', 'max:'.$maxKb],
            'idempotency_key' => ['nullable', 'string', 'max:128'],
        ];
    }

    public function idempotencyKey(): ?string
    {
        $key = $this->input('idempotency_key');

        return is_string($key) ? $key : null;
    }
}
