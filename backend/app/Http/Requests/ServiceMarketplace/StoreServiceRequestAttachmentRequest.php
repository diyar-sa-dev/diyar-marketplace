<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class StoreServiceRequestAttachmentRequest extends FormRequest
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
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,webp,pdf'],
        ];
    }
}
