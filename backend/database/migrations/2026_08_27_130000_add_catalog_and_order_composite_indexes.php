<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stage 28.9 deep pass — composite indexes for catalog filters and order lists.
     *
     * Note: orders_created_at_index already exists (2026_08_26_264100_analytics_performance_indexes).
     */
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if (! $this->hasIndex('products', 'products_category_status_created_at_index')) {
                $table->index(
                    ['category_id', 'status', 'created_at'],
                    'products_category_status_created_at_index'
                );
            }
            if (! $this->hasIndex('products', 'products_vendor_status_created_at_index')) {
                $table->index(
                    ['vendor_account_id', 'status', 'created_at'],
                    'products_vendor_status_created_at_index'
                );
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if (! $this->hasIndex('orders', 'orders_user_created_at_index')) {
                $table->index(['user_id', 'created_at'], 'orders_user_created_at_index');
            }
            if (! $this->hasIndex('orders', 'orders_status_created_at_index')) {
                $table->index(['status', 'created_at'], 'orders_status_created_at_index');
            }
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            if ($this->hasIndex('products', 'products_category_status_created_at_index')) {
                $table->dropIndex('products_category_status_created_at_index');
            }
            if ($this->hasIndex('products', 'products_vendor_status_created_at_index')) {
                $table->dropIndex('products_vendor_status_created_at_index');
            }
        });

        Schema::table('orders', function (Blueprint $table) {
            if ($this->hasIndex('orders', 'orders_user_created_at_index')) {
                $table->dropIndex('orders_user_created_at_index');
            }
            if ($this->hasIndex('orders', 'orders_status_created_at_index')) {
                $table->dropIndex('orders_status_created_at_index');
            }
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        $indexes = Schema::getIndexes($table);

        foreach ($indexes as $definition) {
            if (($definition['name'] ?? null) === $index) {
                return true;
            }
        }

        return false;
    }
};
