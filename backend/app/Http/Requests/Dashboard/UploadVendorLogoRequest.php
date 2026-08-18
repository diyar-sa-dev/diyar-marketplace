<?php

namespace App\Http\Requests\Dashboard;

use Illuminate\Foundation\Http\FormRequest;

class UploadVendorLogoRequest extends FormRequest
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
        $maxKb = (int) config('diyar_media.vendor_logo_max_kb', 2048);
        $extensions = implode(',', config('diyar_media.vendor_logo_extensions', []));

        return [
            'logo' => ['required', 'file', "max:{$maxKb}", 'mimes:jpg,jpeg,png,svg'],
        ];
    }
}
