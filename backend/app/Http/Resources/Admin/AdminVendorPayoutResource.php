<?php

namespace App\Http\Resources\Admin;

use App\Models\VendorPayout;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorPayout */
class AdminVendorPayoutResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $vendor = $this->vendorAccount;
        $bank = $vendor?->relationLoaded('bankAccounts')
            ? $vendor->bankAccounts->firstWhere('is_active', true)
            : null;

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'status' => $this->status->value,
            'requested_at' => $this->requested_at?->toIso8601String(),
            'processed_at' => $this->processed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'vendor' => $vendor ? [
                'id' => $vendor->id,
                'business_name' => $vendor->business_name,
                'slug' => $vendor->slug,
                'owner' => $vendor->relationLoaded('user') && $vendor->user ? [
                    'id' => $vendor->user->id,
                    'name' => $vendor->user->name,
                    'email' => $vendor->user->email,
                    'phone' => $vendor->user->phone,
                ] : null,
                'bank_account' => $bank ? [
                    'beneficiary_name' => $bank->beneficiary_name,
                    'bank_code' => $bank->bank_code?->value,
                    'iban_last4' => $bank->iban_last4,
                ] : null,
            ] : null,
        ];
    }
}
