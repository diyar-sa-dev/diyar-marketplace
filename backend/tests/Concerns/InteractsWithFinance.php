<?php

namespace Tests\Concerns;

use App\Models\VendorAccount;
use App\Models\VendorBankAccount;
use Database\Seeders\CommissionRuleSeeder;

trait InteractsWithFinance
{
    protected function seedCommissionRules(): void
    {
        $this->seed(CommissionRuleSeeder::class);
    }

    protected function createVendorBankAccount(VendorAccount $vendorAccount): VendorBankAccount
    {
        return VendorBankAccount::query()->create([
            'vendor_account_id' => $vendorAccount->id,
            'bank_code' => 'snb',
            'beneficiary_name' => 'Test Vendor Account',
            'iban' => 'SA0380000000608010167519',
            'iban_last4' => '7519',
            'is_active' => true,
        ]);
    }
}
