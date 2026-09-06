<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProjectPublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user('admin') !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'category' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'year' => ['nullable', 'integer', 'min:1900', 'max:2100'],
            'status' => ['sometimes', 'string', Rule::enum(ProjectPublicationStatus::class)],
            'cover_image' => ['nullable', 'string', 'max:2048'],
            'published_at' => ['nullable', 'date'],
            'images' => ['sometimes', 'array'],
            'images.*.image_url' => ['required', 'string', 'max:2048'],
            'images.*.alt' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
