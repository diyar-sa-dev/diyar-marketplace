<?php

namespace App\Http\Resources\Admin;

use App\Models\ProviderPayout;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ProviderPayout */
class AdminProviderPayoutResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $provider = $this->providerAccount;
        $bank = $this->relationLoaded('bankAccount')
            ? $this->bankAccount
            : ($provider?->relationLoaded('bankAccounts')
                ? $provider->bankAccounts->firstWhere('is_active', true)
                : null);

        return [
            'id' => $this->id,
            'reference' => $this->reference,
            'amount' => number_format((float) $this->amount, 2, '.', ''),
            'currency' => $this->currency,
            'status' => $this->status->value,
            'requested_at' => $this->requested_at?->toIso8601String(),
            'processed_at' => $this->processed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'provider' => $provider ? [
                'id' => $provider->id,
                'business_name' => $provider->business_name,
                'slug' => $provider->slug,
                'owner' => $provider->relationLoaded('user') && $provider->user ? [
                    'id' => $provider->user->id,
                    'name' => $provider->user->name,
                    'email' => $provider->user->email,
                    'phone' => $provider->user->phone,
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
