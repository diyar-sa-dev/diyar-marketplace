<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\VendorTeamRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorTeamMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->vendorAccount !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'role' => ['required', Rule::in(VendorTeamRole::invitable())],
        ];
    }
}
