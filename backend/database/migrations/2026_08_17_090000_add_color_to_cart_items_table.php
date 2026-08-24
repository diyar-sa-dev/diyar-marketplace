<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('cart_items', 'color_name')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->string('color_name', 64)->default('');
                $table->char('color_hex', 7)->nullable();
            });
        }

        if (! $this->indexExists('cart_items', 'cart_items_cart_product_color_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                if ($this->indexExists('cart_items', 'cart_items_cart_id_product_id_unique')) {
                    $table->dropUnique(['cart_id', 'product_id']);
                }

                $table->unique(['cart_id', 'product_id', 'color_name'], 'cart_items_cart_product_color_unique');
            });
        }

        Schema::table('cart_items', function (Blueprint $table) {
            if (! $this->indexExists('cart_items', 'cart_items_cart_id_index')) {
                $table->index('cart_id', 'cart_items_cart_id_index');
            }

            if (! $this->indexExists('cart_items', 'cart_items_product_id_index')) {
                $table->index('product_id', 'cart_items_product_id_index');
            }
        });
    }

    public function down(): void
    {
        if ($this->indexExists('cart_items', 'cart_items_cart_product_color_unique')) {
            Schema::table('cart_items', function (Blueprint $table) {
                $table->dropUnique('cart_items_cart_product_color_unique');
                $table->unique(['cart_id', 'product_id']);
            });
        }

        Schema::table('cart_items', function (Blueprint $table) {
            if ($this->indexExists('cart_items', 'cart_items_cart_id_index')) {
                $table->dropIndex('cart_items_cart_id_index');
            }

            if ($this->indexExists('cart_items', 'cart_items_product_id_index')) {
                $table->dropIndex('cart_items_product_id_index');
            }

            if (Schema::hasColumn('cart_items', 'color_name')) {
                $table->dropColumn(['color_name', 'color_hex']);
            }
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        return Schema::hasIndex($table, $index);
    }
};
