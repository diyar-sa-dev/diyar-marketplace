<?php

namespace App\Http\Requests\B2b;

use App\Enums\B2bLeadBudgetRange;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreB2bLeadRequest extends FormRequest
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
            'project_type' => ['required', 'string', 'min:3', 'max:200'],
            'estimated_quantity' => ['nullable', 'string', 'max:120'],
            'details' => ['required', 'string', 'min:10', 'max:5000'],
            'budget_range' => ['nullable', Rule::enum(B2bLeadBudgetRange::class)],
        ];
    }
}
