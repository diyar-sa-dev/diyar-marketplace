<?php

namespace App\Domains\B2b\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadPartnerB2bPortfolioImageRequest extends FormRequest
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
        ];
    }
}
