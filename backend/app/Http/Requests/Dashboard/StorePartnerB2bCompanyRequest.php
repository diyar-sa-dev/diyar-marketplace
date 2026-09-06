<?php

namespace App\Http\Requests\Dashboard;

use App\Http\Requests\Dashboard\Concerns\PreparesPartnerB2bCompanyInput;
use Illuminate\Foundation\Http\FormRequest;

class StorePartnerB2bCompanyRequest extends FormRequest
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
            'b2b_category_id' => ['nullable', 'uuid', 'exists:b2b_categories,id'],
            'custom_category' => ['nullable', 'string', 'min:2', 'max:100'],
            'name' => ['required', 'string', 'min:2', 'max:200'],
            'slug' => ['nullable', 'string', 'max:200'],
            'description' => ['nullable', 'string', 'max:1000'],
            'about' => ['nullable', 'string', 'max:20000'],
            'logo' => ['nullable', 'string', 'max:500'],
            'cover_image' => ['nullable', 'string', 'max:500'],
            'location' => ['nullable', 'string', 'max:200'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'regex:/^9665\d{8}$/'],
            'email' => ['nullable', 'email', 'max:200'],
            'website' => ['nullable', 'url', 'max:500'],
            'business_hours' => ['nullable', 'string', 'max:200'],
            'years_experience' => ['nullable', 'integer', 'min:0', 'max:200'],
            'team_size' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'completed_projects' => ['nullable', 'integer', 'min:0', 'max:1000000'],
            'tag_ids' => ['nullable', 'array', 'max:10'],
            'tag_ids.*' => ['uuid', 'exists:b2b_tags,id'],
            'tag_names' => ['nullable', 'array', 'max:10'],
            'tag_names.*' => ['string', 'min:2', 'max:50'],
            'services' => ['nullable', 'array', 'max:20'],
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
