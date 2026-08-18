<?php

namespace App\Http\Resources;

use App\Models\VendorBankAccount;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin VendorBankAccount */
class VendorBankAccountResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'bank_code' => $this->bank_code->value,
            'bank_label' => __("diyar.vendor.banks.{$this->bank_code->value}"),
            'beneficiary_name' => $this->beneficiary_name,
            'iban_masked' => $this->iban_last4
                ? 'SA** **** **** '.$this->iban_last4
                : null,
            'iban_last4' => $this->iban_last4,
            'is_active' => $this->is_active,
        ];
    }
}
