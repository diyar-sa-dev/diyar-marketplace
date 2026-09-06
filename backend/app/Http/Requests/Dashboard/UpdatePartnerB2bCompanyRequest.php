<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\Dashboard\Concerns\PreparesPartnerB2bCompanyInput;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePartnerB2bCompanyRequest extends FormRequest
{
    use PreparesPartnerB2bCompanyInput;

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
            'b2b_category_id' => ['sometimes', 'nullable', 'uuid', 'exists:b2b_categories,id'],
            'custom_category' => ['sometimes', 'nullable', 'string', 'min:2', 'max:100'],
            'name' => ['sometimes', 'string', 'min:2', 'max:200'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:200'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'about' => ['sometimes', 'nullable', 'string', 'max:20000'],
            'logo' => ['sometimes', 'nullable', 'string', 'max:500'],
            'cover_image' => ['sometimes', 'nullable', 'string', 'max:500'],
            'location' => ['sometimes', 'nullable', 'string', 'max:200'],
            'address' => ['sometimes', 'nullable', 'string', 'max:500'],
            'phone' => ['sometimes', 'nullable', 'string', 'regex:/^9665\d{8}$/'],
            'email' => ['sometimes', 'nullable', 'email', 'max:200'],
            'website' => ['sometimes', 'nullable', 'url', 'max:500'],
            'business_hours' => ['sometimes', 'nullable', 'string', 'max:200'],
            'years_experience' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:200'],
            'team_size' => ['sometimes', 'nullable', 'integer', 'min:1', 'max:100000'],
            'completed_projects' => ['sometimes', 'nullable', 'integer', 'min:0', 'max:1000000'],
            'tag_ids' => ['sometimes', 'nullable', 'array', 'max:10'],
            'tag_ids.*' => ['uuid', 'exists:b2b_tags,id'],
            'tag_names' => ['sometimes', 'nullable', 'array', 'max:10'],
            'tag_names.*' => ['string', 'min:2', 'max:50'],
            'services' => ['sometimes', 'nullable', 'array', 'max:20'],
            'services.*.name' => ['required_with:services', 'string', 'max:200'],
            'services.*.description' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.regex' => __('diyar.registration.invalid_phone'),
        ];
    }
}
