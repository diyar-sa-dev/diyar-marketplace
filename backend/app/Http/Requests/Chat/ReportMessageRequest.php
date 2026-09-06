<?php

namespace App\Http\Requests\Chat;

use App\Support\Chat\ChatReportCatalog;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ReportMessageRequest extends FormRequest
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
            'reason' => ['required', 'string', Rule::in(ChatReportCatalog::reasonValues())],
            'details' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
