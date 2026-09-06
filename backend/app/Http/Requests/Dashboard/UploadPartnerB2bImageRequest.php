<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadPartnerB2bImageRequest extends FormRequest
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
            'image' => ['required', 'file', 'max:'.$maxKb, 'mimes:jpg,jpeg,png,webp'],
            'type' => ['required', Rule::in(['logo', 'cover'])],
        ];
    }
}
