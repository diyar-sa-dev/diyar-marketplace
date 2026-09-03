<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $indexes = collect(DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_search_fulltext']));

        if ($indexes->isEmpty()) {
            DB::statement('ALTER TABLE products ADD FULLTEXT products_search_fulltext (name, description)');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement('ALTER TABLE products DROP INDEX products_search_fulltext');
    }
};
