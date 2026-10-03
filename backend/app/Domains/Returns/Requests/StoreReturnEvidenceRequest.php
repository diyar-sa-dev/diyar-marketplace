<?php

namespace App\Domains\Returns\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReturnEvidenceRequest extends FormRequest
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
            'file' => ['required', 'file', 'max:5120'],
        ];
    }
}
