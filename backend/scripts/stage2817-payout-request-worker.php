<?php

declare(strict_types=1);

/**
 * Worker: attempt one vendor payout request against a shared sqlite DB.
 *
 * Args: db_path vendor_account_id amount
 * Exit 0 = payout created, 1 = rejected
 */
$dbPath = $argv[1] ?? '';
$vendorAccountId = $argv[2] ?? '';
$amount = $argv[3] ?? '';

if ($dbPath === '' || $vendorAccountId === '' || $amount === '') {
    fwrite(STDERR, "usage: payout-request-worker.php db_path vendor_account_id amount\n");
    exit(2);
}

require __DIR__.'/concurrency-worker-bootstrap.php';
bootstrapConcurrencyWorker($dbPath);

use App\Models\VendorAccount;
use App\Services\Finance\PayoutService;

try {
    $vendorAccount = VendorAccount::query()->findOrFail($vendorAccountId);

    app(PayoutService::class)->request($vendorAccount, $amount, 'SAR');

    echo "created\n";
    exit(0);
} catch (Throwable $e) {
    echo 'rejected: '.$e->getMessage()."\n";
    exit(1);
}
