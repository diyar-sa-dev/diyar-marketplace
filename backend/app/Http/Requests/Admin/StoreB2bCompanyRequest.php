<?php

namespace App\Http\Requests\Admin;

use App\Enums\B2bPublicationStatus;
use App\Enums\B2bVerificationStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreB2bCompanyRequest extends FormRequest
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
            'b2b_category_id' => ['nullable', 'uuid', 'exists:b2b_categories,id'],
            'owner_user_id' => ['nullable', 'uuid', 'exists:users,id'],
            'vendor_account_id' => ['nullable', 'uuid', 'exists:vendor_accounts,id'],
            'provider_account_id' => ['nullable', 'uuid', 'exists:provider_accounts,id'],
            'name' => ['required', 'string', 'min:2', 'max:200'],
            'slug' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'about' => ['nullable', 'string', 'max:20000'],
            'logo' => ['nullable', 'string', 'max:500'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'string', 'max:200'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:200'],
            'website' => ['nullable', 'url', 'max:500'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:200'],
            'team_size' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'completed_projects' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'rating' => ['nullable', 'numeric', 'min:0', 'max:5'],
            'reviews_count' => ['nullable', 'integer', 'min:0', 'max:10000000'],
            'publication_status' => ['nullable', Rule::enum(B2bPublicationStatus::class)],
            'verification_status' => ['nullable', Rule::enum(B2bVerificationStatus::class)],
            'featured' => ['nullable', 'boolean'],
            'admin_notes' => ['nullable', 'string', 'max:5000'],
            'tag_ids' => ['nullable', 'array'],
            'tag_ids.*' => ['uuid', 'exists:b2b_tags,id'],
            'project_ids' => ['nullable', 'array', 'max:24'],
            'project_ids.*' => ['uuid', 'exists:projects,id'],
            'services' => ['nullable', 'array', 'max:20'],
            'services.*.name' => ['required_with:services', 'string', 'max:200'],
            'services.*.description' => ['nullable', 'string', 'max:2000'],
            'testimonials' => ['nullable', 'array', 'max:20'],
            'testimonials.*.author_name' => ['required_with:testimonials', 'string', 'max:200'],
            'testimonials.*.author_role' => ['nullable', 'string', 'max:200'],
            'testimonials.*.rating' => ['nullable', 'integer', 'min:1', 'max:5'],
            'testimonials.*.content' => ['required_with:testimonials', 'string', 'max:5000'],
        ];
    }
}
