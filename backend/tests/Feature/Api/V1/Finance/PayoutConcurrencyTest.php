<?php

namespace Tests\Feature\Api\V1\Finance;

use App\Enums\BalanceBucket;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use App\Enums\PayoutStatus;
use App\Enums\RoleName;
use App\Models\FinancialTransaction;
use App\Models\VendorBankAccount;
use App\Models\VendorPayout;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\Process\Process;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PayoutConcurrencyTest extends TestCase
{
    use InteractsWithIdentity;

    /** @var array{connection: string|null, database: string|null} */
    private array $previousDatabaseConfig = [
        'connection' => null,
        'database' => null,
    ];

    protected function tearDown(): void
    {
        $this->restoreDefaultDatabaseConnection();

        parent::tearDown();
    }

    #[Test]
    public function parallel_payout_requests_for_full_balance_allow_exactly_one_pending(): void
    {
        if (! class_exists(Process::class)) {
            $this->markTestSkipped('Symfony Process not available.');
        }

        $this->previousDatabaseConfig = [
            'connection' => $_ENV['DB_CONNECTION'] ?? null,
            'database' => $_ENV['DB_DATABASE'] ?? null,
        ];

        $dbPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_payout_race_'.Str::uuid()->toString().'.sqlite';
        touch($dbPath);
        $dbPath = (string) realpath($dbPath);

        try {
            putenv('DB_CONNECTION=sqlite');
            putenv('DB_DATABASE='.$dbPath);
            $_ENV['DB_CONNECTION'] = 'sqlite';
            $_ENV['DB_DATABASE'] = $dbPath;
            require_once base_path('scripts/concurrency-worker-bootstrap.php');
            configureConcurrencySqlite($dbPath);

            Artisan::call('migrate:fresh', ['--force' => true]);

            $vendorUser = $this->createUserWithRole(RoleName::Vendor);
            $vendorAccount = $vendorUser->vendorAccount;

            VendorBankAccount::query()->create([
                'vendor_account_id' => $vendorAccount->id,
                'bank_code' => 'snb',
                'beneficiary_name' => 'Concurrency Vendor',
                'iban' => 'SA0380000000608010167519',
                'iban_last4' => '7519',
                'is_active' => true,
            ]);

            FinancialTransaction::query()->create([
                'reference' => 'FT-CONC-'.Str::upper(Str::random(8)),
                'transaction_type' => FinancialTransactionType::EscrowRelease,
                'source_type' => 'concurrency_test_credit',
                'source_id' => (string) Str::uuid(),
                'vendor_account_id' => $vendorAccount->id,
                'amount' => '100.00',
                'currency' => 'SAR',
                'direction' => FinancialDirection::Credit,
                'balance_bucket' => BalanceBucket::VendorAvailable,
                'description' => 'Concurrency test credit',
            ]);

            $amount = '100.00';
            $worker = __DIR__.'/../../../../../scripts/stage2817-payout-request-worker.php';
            $php = PHP_BINARY;
            $processes = [];

            for ($i = 0; $i < 4; $i++) {
                $process = new Process([
                    $php,
                    $worker,
                    $dbPath,
                    (string) $vendorAccount->id,
                    $amount,
                ]);
                $process->setWorkingDirectory(base_path());
                $processes[] = $process;
            }

            DB::disconnect('sqlite');

            foreach ($processes as $process) {
                $process->start();
            }

            $successes = 0;
            $failures = 0;
            $workerOutputs = [];

            foreach ($processes as $process) {
                $process->wait();
                $workerOutputs[] = trim($process->getOutput().$process->getErrorOutput());
                if ($process->isSuccessful()) {
                    $successes++;
                } else {
                    $failures++;
                }
            }

            configureConcurrencySqlite($dbPath);

            $this->assertSame(1, $successes, 'Expected exactly one successful payout request. Workers: '.implode(' | ', $workerOutputs));
            $this->assertSame(3, $failures, 'Expected three rejected payout requests');
            $this->assertSame(1, VendorPayout::query()->where('vendor_account_id', $vendorAccount->id)->count());
            $this->assertSame(
                PayoutStatus::Pending,
                VendorPayout::query()->where('vendor_account_id', $vendorAccount->id)->firstOrFail()->status,
            );
        } finally {
            @unlink($dbPath);
            $this->restoreDefaultDatabaseConnection();
        }
    }

    private function restoreDefaultDatabaseConnection(): void
    {
        $connection = $this->previousDatabaseConfig['connection'] ?? 'sqlite';
        $database = $this->previousDatabaseConfig['database'] ?? ':memory:';

        putenv('DB_CONNECTION='.$connection);
        putenv('DB_DATABASE='.$database);
        $_ENV['DB_CONNECTION'] = $connection;
        $_ENV['DB_DATABASE'] = $database;
        config([
            'database.default' => $connection,
            'database.connections.sqlite.database' => $database,
        ]);
        DB::purge('sqlite');
        DB::reconnect('sqlite');
    }
}
