<?php

namespace App\Http\Requests\Admin;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateB2bCompanyRequest extends FormRequest
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
            'b2b_category_id' => ['sometimes', 'nullable', 'uuid', 'exists:b2b_categories,id'],
            'owner_user_id' => ['sometimes', 'nullable', 'uuid', 'exists:users,id'],
            'vendor_account_id' => ['sometimes', 'nullable', 'uuid', 'exists:vendor_accounts,id'],
            'provider_account_id' => ['sometimes', 'nullable', 'uuid', 'exists:provider_accounts,id'],
            'name' => ['sometimes', 'string', 'min:2', 'max:200'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'about' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'logo' => ['sometimes', 'nullable', 'string', 'max:500'],
            'cover_image' => ['sometimes', 'nullable', 'string', 'max:500'],
            'location' => ['sometimes', 'nullable', 'string', 'max:200'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'email' => ['sometimes', 'nullable', 'email', 'max:200'],
            'website' => ['sometimes', 'nullable', 'url', 'max:500'],
            'years_experience' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:200'],
            'team_size' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000'],
            'completed_projects' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000000'],
            'rating' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:5'],
            'reviews_count' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:10000000'],
            'publication_status' => ['sometimes', Rule::enum(B2bPublicationStatus::class)],
            'verification_status' => ['sometimes', Rule::enum(B2bVerificationStatus::class)],
            'featured' => ['sometimes', 'boolean'],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'tag_ids' => ['sometimes', 'nullable', 'array'],
            'tag_ids.*' => ['uuid', 'exists:b2b_tags,id'],
            'project_ids' => ['sometimes', 'nullable', 'array', 'max:24'],
            'project_ids.*' => ['uuid', 'exists:projects,id'],
            'services' => ['sometimes', 'nullable', 'array', 'max:20'],
            'services.*.name' => ['required_with:services', 'string', 'max:200'],
            'services.*.description' => ['nullable', 'string', 'max:2000'],
            'testimonials' => ['sometimes', 'nullable', 'array', 'max:20'],
            'testimonials.*.author_name' => ['required_with:testimonials', 'string', 'max:200'],
            'testimonials.*.author_role' => ['nullable', 'string', 'max:200'],
            'testimonials.*.rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'testimonials.*.content' => ['required_with:testimonials', 'string', 'max:5000'],
        ];
    }
}
