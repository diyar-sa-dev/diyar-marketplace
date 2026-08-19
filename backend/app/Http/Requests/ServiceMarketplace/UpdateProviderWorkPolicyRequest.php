<?php

namespace App\Http\Requests\ServiceMarketplace;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProviderWorkPolicyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->providerAccount !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'policy_enabled' => ['sometimes', 'boolean'],
            'initial_delivery_days' => ['sometimes', 'integer', 'min:0', 'max:365'],
            'free_revisions_included' => ['sometimes', 'integer', 'min:0', 'max:20'],
            'timeline_by_project_scope' => ['sometimes', 'boolean'],
            'cancellation_notice_hours' => ['nullable', 'integer', 'min:0', 'max:720'],
            'custom_terms' => ['sometimes', 'array', 'max:5'],
            'custom_terms.*' => ['string', 'max:500'],
        ];
    }
}
