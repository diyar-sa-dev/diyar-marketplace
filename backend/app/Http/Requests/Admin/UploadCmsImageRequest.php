<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UploadCmsImageRequest extends FormRequest
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
        $maxKb = (int) config('diyar_media.max_upload_kb', 5120);

        return [
            'image' => [
                'required',
                'file',
                'max:'.$maxKb,
                'mimes:jpg,jpeg,png,webp',
            ],
            'context' => [
                'nullable',
                Rule::in(['blog_hero', 'blog_avatar', 'project_cover', 'project_gallery', 'b2b_logo', 'b2b_cover']),
            ],
        ];
    }

    public function contextKey(): string
    {
        return (string) ($this->validated()['context'] ?? 'blog_hero');
    }
}
