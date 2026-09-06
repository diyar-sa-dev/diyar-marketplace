<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_accounts', function (Blueprint $table) {
            if (! $this->indexExists('vendor_accounts', 'vendor_accounts_status_index')) {
                $table->index('status', 'vendor_accounts_status_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vendor_accounts', function (Blueprint $table) {
            $table->dropIndex('vendor_accounts_status_index');
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();
        $driver = $connection->getDriverName();

        if ($driver === 'sqlite') {
            $rows = $connection->select("PRAGMA index_list('{$table}')");

            return collect($rows)->contains(fn ($row) => ($row->name ?? null) === $index);
        }

        $database = $connection->getDatabaseName();
        $rows = $connection->select(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$database, $table, $index],
        );

        return $rows !== [];
    }
};
