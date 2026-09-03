<?php

namespace App\Http\Resources;

use App\Models\AffiliateProfile;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliateProfile */
class AffiliateProfileResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'referral_code' => $this->referral_code,
            'status' => $this->status->value,
            'display_name' => $this->display_name,
            'payout_account_holder' => $this->payout_account_holder,
            'payout_iban' => $this->payout_iban,
            'payout_iban_masked' => $this->payout_iban
                ? 'SA** **** **** '.substr((string) $this->payout_iban, -4)
                : null,
            'payout_bank_code' => $this->payout_bank_code,
            'payout_bank_name' => $this->payout_bank_name,
            'social_links' => $this->social_links ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'user' => $this->whenLoaded('user', fn () => $this->user === null ? null : [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
                'status' => $this->user->status->value,
            ]),
        ];
    }
}
