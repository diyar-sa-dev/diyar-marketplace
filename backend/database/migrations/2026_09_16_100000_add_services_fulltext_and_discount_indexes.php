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

        // 1. Discount virtual generated column and index on products
        $hasDiscountColumn = collect(DB::select("SHOW COLUMNS FROM products LIKE 'discount_amount'"))->isNotEmpty();
        if (! $hasDiscountColumn) {
            DB::statement('ALTER TABLE products ADD COLUMN discount_amount DECIMAL(12,2) GENERATED ALWAYS AS (GREATEST(0, COALESCE(compare_price, sale_price) - sale_price)) STORED');
        }

        $indexes = collect(DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_status_discount_amount_idx']));
        if ($indexes->isEmpty()) {
            DB::statement('CREATE INDEX products_status_discount_amount_idx ON products (status, discount_amount DESC)');
        }

        // Check if ngram parser is supported by MySQL/MariaDB instance
        $hasNgram = collect(DB::select('SHOW PLUGINS'))->contains('Name', 'ngram');

        // 2. Fulltext index on services (title, description)
        $servicesIndexes = collect(DB::select('SHOW INDEX FROM services WHERE Key_name = ?', ['services_search_fulltext']));
        if ($servicesIndexes->isEmpty()) {
            if ($hasNgram) {
                DB::statement('ALTER TABLE services ADD FULLTEXT services_search_fulltext (title, description) WITH PARSER ngram');
            } else {
                DB::statement('ALTER TABLE services ADD FULLTEXT services_search_fulltext (title, description)');
            }
        }

        // 3. Products fulltext index with ngram if supported
        if ($hasNgram) {
            $productIndexes = collect(DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_search_fulltext']));
            if ($productIndexes->isNotEmpty()) {
                DB::statement('ALTER TABLE products DROP INDEX products_search_fulltext');
            }
            DB::statement('ALTER TABLE products ADD FULLTEXT products_search_fulltext (name, description) WITH PARSER ngram');
        }
    }

    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() !== 'mysql') {
            return;
        }

        $servicesIndexes = collect(DB::select('SHOW INDEX FROM services WHERE Key_name = ?', ['services_search_fulltext']));
        if ($servicesIndexes->isNotEmpty()) {
            DB::statement('ALTER TABLE services DROP INDEX services_search_fulltext');
        }

        $discountIndexes = collect(DB::select('SHOW INDEX FROM products WHERE Key_name = ?', ['products_status_discount_amount_idx']));
        if ($discountIndexes->isNotEmpty()) {
            DB::statement('ALTER TABLE products DROP INDEX products_status_discount_amount_idx');
        }

        $hasDiscountColumn = collect(DB::select("SHOW COLUMNS FROM products LIKE 'discount_amount'"))->isNotEmpty();
        if ($hasDiscountColumn) {
            DB::statement('ALTER TABLE products DROP COLUMN discount_amount');
        }
    }
};
