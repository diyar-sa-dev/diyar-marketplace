<?php

namespace App\Http\Resources\Admin;

use App\Models\AffiliatePayout;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AffiliatePayout */
class AdminAffiliatePayoutResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $profile = $this->profile;

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'status' => $this->status->value,
            'requested_at' => $this->requested_at?->toIso8601String(),
            'processed_at' => $this->processed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'payment_reference' => $this->payment_reference,
            'affiliate' => $profile ? [
                'id' => $profile->id,
                'display_name' => $profile->display_name,
                'referral_code' => $profile->referral_code,
                'payout_account_holder' => $profile->payout_account_holder,
                'payout_iban' => $profile->payout_iban,
                'payout_bank_name' => $profile->payout_bank_name,
                'owner' => $profile->relationLoaded('user') && $profile->user ? [
                    'id' => $profile->user->id,
                    'name' => $profile->user->name,
                    'email' => $profile->user->email,
                    'phone' => $profile->user->phone,
                ] : null,
            ] : null,
        ];
    }
}
