<?php

namespace App\Http\Requests\Projects;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProjectListRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('per_page') && is_numeric($this->input('per_page'))) {
            $this->merge([
                'per_page' => min(max((int) $this->input('per_page'), 1), 48),
            ]);
        }

        if ($this->has('page') && is_numeric($this->input('page'))) {
            $this->merge([
                'page' => max((int) $this->input('page'), 1),
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
            'category' => ['nullable', 'string', 'max:120'],
            'q' => ['nullable', 'string', 'max:120'],
            'sort' => ['nullable', Rule::in(['latest', 'oldest', 'year'])],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedFilters(): array
    {
        $validated = $this->validated();

        if (isset($validated['q'])) {
            $validated['q'] = preg_replace('/\s+/u', ' ', trim((string) $validated['q'])) ?: null;
        }

        return $validated;
    }
}
