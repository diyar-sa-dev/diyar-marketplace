<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class UploadVendorCoverRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->vendorAccount !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maxKb = (int) config('diyar_media.vendor_cover_max_kb', 5120);

        return [
            'cover' => ['required', 'file', "max:{$maxKb}", 'mimes:jpg,jpeg,png,webp'],
        ];
    }
}
