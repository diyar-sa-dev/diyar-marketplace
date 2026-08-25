<?php

namespace App\Http\Requests\Admin;

use App\Enums\ProjectPublicationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProjectRequest extends FormRequest
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
        $projectId = $this->route('project');

        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('projects', 'slug')->ignore($projectId)],
            'description' => ['sometimes', 'nullable', 'string'],
            'category' => ['sometimes', 'string', 'max:255'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'year' => ['sometimes', 'nullable', 'integer', 'min:1900', 'max:2100'],
            'status' => ['sometimes', 'string', Rule::enum(ProjectPublicationStatus::class)],
            'cover_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'images' => ['sometimes', 'array'],
            'images.*.image_url' => ['required', 'string', 'max:2048'],
            'images.*.alt' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
