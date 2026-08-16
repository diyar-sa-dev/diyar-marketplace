<?php

namespace App\Http\Requests\Profile;

use Illuminate\Foundation\Http\FormRequest;

class UploadAvatarRequest extends FormRequest
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
        $maxKb = (int) config('diyar_media.max_upload_kb', 5120);

        return [
            'avatar' => [
                'required',
                'file',
                'max:'.$maxKb,
                'mimes:jpg,jpeg,png,webp',
            ],
        ];
    }
}
