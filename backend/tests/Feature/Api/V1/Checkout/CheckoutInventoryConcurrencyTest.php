<?php

namespace Tests\Feature\Api\V1\Checkout;

use App\Enums\RoleName;
use App\Models\Product;
use App\Models\ProductInventory;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Symfony\Component\Process\Process;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class CheckoutInventoryConcurrencyTest extends TestCase
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
    public function parallel_reserves_on_last_unit_allow_exactly_one_success(): void
    {
        if (! class_exists(Process::class)) {
            $this->markTestSkipped('Symfony Process not available.');
        }

        $this->previousDatabaseConfig = [
            'connection' => $_ENV['DB_CONNECTION'] ?? null,
            'database' => $_ENV['DB_DATABASE'] ?? null,
        ];

        $dbPath = sys_get_temp_dir().DIRECTORY_SEPARATOR.'diyar_inventory_race_'.Str::uuid()->toString().'.sqlite';
        touch($dbPath);
        $dbPath = (string) realpath($dbPath);

        try {
            putenv('DB_CONNECTION=sqlite');
            putenv('DB_DATABASE='.$dbPath);
            $_ENV['DB_CONNECTION'] = 'sqlite';
            $_ENV['DB_DATABASE'] = $dbPath;
            config(['database.connections.sqlite.database' => $dbPath]);
            DB::purge('sqlite');
            DB::reconnect('sqlite');

            Artisan::call('migrate:fresh', ['--force' => true]);

            $vendor = $this->createUserWithRole(RoleName::Vendor);
            $product = Product::factory()->create([
                'vendor_account_id' => $vendor->vendorAccount->id,
                'sale_price' => '100.00',
            ]);

            $inventory = ProductInventory::query()->where('product_id', $product->id)->firstOrFail();
            $inventory->forceFill([
                'stock_quantity' => 1,
                'reserved_quantity' => 0,
            ]);
            $inventory->syncAvailableQuantity();
            $inventory->save();

            $customers = [];
            for ($i = 0; $i < 6; $i++) {
                $customers[] = $this->createUserWithRole(RoleName::Customer, [
                    'phone' => '96650900000'.str_pad((string) $i, 2, '0', STR_PAD_LEFT),
                ]);
            }

            $worker = __DIR__.'/../../../../../scripts/stage2817-inventory-reserve-worker.php';
            $php = PHP_BINARY;
            $processes = [];

            foreach ($customers as $customer) {
                $processes[] = new Process([$php, $worker, $dbPath, $product->id, $customer->id]);
            }

            foreach ($processes as $process) {
                $process->start();
            }

            $successes = 0;
            $failures = 0;

            foreach ($processes as $process) {
                $process->wait();
                if ($process->isSuccessful()) {
                    $successes++;
                } else {
                    $failures++;
                }
            }

            config(['database.connections.sqlite.database' => $dbPath]);
            DB::purge('sqlite');
            DB::reconnect('sqlite');
            $inventory = ProductInventory::query()->where('product_id', $product->id)->firstOrFail();

            $this->assertSame(1, $successes, 'Expected exactly one successful reservation');
            $this->assertSame(5, $failures, 'Expected five rejected reservations');
            $this->assertSame(1, $inventory->fresh()->reserved_quantity);
            $this->assertSame(0, $inventory->fresh()->available_quantity);
            $this->assertGreaterThanOrEqual(0, $inventory->fresh()->stock_quantity);
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
