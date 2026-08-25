<?php

namespace App\Http\Requests\Admin;

use App\Enums\BlogArticleStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBlogArticleRequest extends FormRequest
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
        $articleId = $this->route('article');

        return [
            'blog_category_id' => ['sometimes', 'nullable', 'uuid', 'exists:blog_categories,id'],
            'title' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('blog_articles', 'slug')->ignore($articleId)],
            'excerpt' => ['sometimes', 'nullable', 'string'],
            'content' => ['sometimes', 'string'],
            'hero_image' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'author_name' => ['sometimes', 'string', 'max:255'],
            'author_avatar' => ['sometimes', 'nullable', 'string', 'max:2048'],
            'author_role' => ['sometimes', 'nullable', 'string', 'max:255'],
            'published_at' => ['sometimes', 'nullable', 'date'],
            'status' => ['sometimes', 'string', Rule::enum(BlogArticleStatus::class)],
            'seo_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'seo_description' => ['sometimes', 'nullable', 'string'],
            'tag_ids' => ['sometimes', 'array'],
            'tag_ids.*' => ['uuid', 'exists:blog_tags,id'],
        ];
    }
}
