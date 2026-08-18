<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\VendorTeamRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InviteVendorTeamMemberRequest extends FormRequest
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
            'email' => ['required', 'email', 'max:255'],
            'role' => ['required', Rule::in(VendorTeamRole::invitable())],
            'locale' => ['sometimes', 'string', Rule::in(['ar', 'en'])],
        ];
    }
}
