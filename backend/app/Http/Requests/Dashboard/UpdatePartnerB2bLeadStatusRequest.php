<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\B2bLeadStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartnerB2bLeadStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in([
                B2bLeadStatus::Accepted->value,
                B2bLeadStatus::Rejected->value,
            ])],
        ];
    }
}
