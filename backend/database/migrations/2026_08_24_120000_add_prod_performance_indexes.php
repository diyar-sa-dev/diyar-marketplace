<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Production query-path indexes (PostgreSQL + MySQL compatible).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (! $this->hasIndex('products', 'products_status_created_at_index')) {
                    $table->index(['status', 'created_at'], 'products_status_created_at_index');
                }
                if (! $this->hasIndex('products', 'products_status_sale_price_index')) {
                    $table->index(['status', 'sale_price'], 'products_status_sale_price_index');
                }
                if (! $this->hasIndex('products', 'products_slug_index')) {
                    $table->index('slug', 'products_slug_index');
                }
            });
        }

        if (Schema::hasTable('vendor_orders')) {
            Schema::table('vendor_orders', function (Blueprint $table) {
                if (! $this->hasIndex('vendor_orders', 'vendor_orders_vendor_created_at_index')) {
                    $table->index(['vendor_account_id', 'created_at'], 'vendor_orders_vendor_created_at_index');
                }
                if (! $this->hasIndex('vendor_orders', 'vendor_orders_vendor_status_created_at_index')) {
                    $table->index(['vendor_account_id', 'status', 'created_at'], 'vendor_orders_vendor_status_created_at_index');
                }
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (! $this->hasIndex('order_items', 'order_items_product_id_index')) {
                    $table->index('product_id', 'order_items_product_id_index');
                }
            });
        }

        if (Schema::hasTable('product_inventory')) {
            Schema::table('product_inventory', function (Blueprint $table) {
                if (! $this->hasIndex('product_inventory', 'product_inventory_available_quantity_index')) {
                    $table->index('available_quantity', 'product_inventory_available_quantity_index');
                }
            });
        }

        if (Schema::hasTable('product_colors')) {
            Schema::table('product_colors', function (Blueprint $table) {
                if (! $this->hasIndex('product_colors', 'product_colors_product_id_name_index')) {
                    $table->index(['product_id', 'name'], 'product_colors_product_id_name_index');
                }
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (! $this->hasIndex('orders', 'orders_created_at_index')) {
                    $table->index('created_at', 'orders_created_at_index');
                }
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (! $this->hasIndex('payments', 'payments_status_index')) {
                    $table->index('status', 'payments_status_index');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropIndex('products_status_created_at_index');
                $table->dropIndex('products_status_sale_price_index');
                $table->dropIndex('products_slug_index');
            });
        }

        if (Schema::hasTable('vendor_orders')) {
            Schema::table('vendor_orders', function (Blueprint $table) {
                $table->dropIndex('vendor_orders_vendor_created_at_index');
                $table->dropIndex('vendor_orders_vendor_status_created_at_index');
            });
        }

        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex('order_items_product_id_index');
            });
        }

        if (Schema::hasTable('product_inventory')) {
            Schema::table('product_inventory', function (Blueprint $table) {
                $table->dropIndex('product_inventory_available_quantity_index');
            });
        }

        if (Schema::hasTable('product_colors')) {
            Schema::table('product_colors', function (Blueprint $table) {
                $table->dropIndex('product_colors_product_id_name_index');
            });
        }

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex('orders_created_at_index');
            });
        }

        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                $table->dropIndex('payments_status_index');
            });
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        return Schema::hasIndex($table, $indexName);
    }
};
