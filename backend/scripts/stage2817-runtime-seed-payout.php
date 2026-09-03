<?php

declare(strict_types=1);

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Enums\BalanceBucket;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Models\VendorBankAccount;
use Illuminate\Support\Str;

$password = (string) config('diyar.demo.password', 'Password123!');
$user = User::query()->where('phone', '966500000002')->firstOrFail();
$user->load('vendorAccount');
$vendorAccount = $user->vendorAccount;
if ($vendorAccount === null) {
    fwrite(STDERR, "Demo vendor account missing\n");
    exit(1);
}

VendorBankAccount::query()->updateOrCreate(
    ['vendor_account_id' => $vendorAccount->id, 'is_active' => true],
    [
        'bank_code' => 'snb',
        'beneficiary_name' => 'DIYAR Demo Vendor',
        'iban' => 'SA0380000000608010167519',
        'iban_last4' => '7519',
    ],
);

FinancialTransaction::query()->create([
    'reference' => 'FT-PG-'.Str::upper(Str::random(8)),
    'transaction_type' => FinancialTransactionType::EscrowRelease,
    'source_type' => 'payout_gate_credit',
    'source_id' => (string) Str::uuid(),
    'vendor_account_id' => $vendorAccount->id,
    'amount' => '100.00',
    'currency' => 'SAR',
    'direction' => FinancialDirection::Credit,
    'balance_bucket' => BalanceBucket::VendorAvailable,
    'description' => 'Payout gate credit',
]);

echo json_encode([
    'vendor' => [
        'identifier' => '500000002',
        'password' => $password,
        'vendor_account_id' => $vendorAccount->id,
    ],
    'amount' => '100.00',
], JSON_THROW_ON_ERROR | JSON_PRETTY_PRINT)."\n";
