<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_number_sequences', function (Blueprint $table) {
            $table->string('date', 8)->primary();
            $table->unsignedInteger('last_sequence')->default(0);
            $table->timestamps();
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('order_number', 32)->unique();
            $table->string('status', 32);
            $table->foreignUuid('shipping_address_id')->constrained('addresses')->restrictOnDelete();
            $table->string('shipping_recipient_name');
            $table->string('shipping_phone', 32);
            $table->string('shipping_city')->nullable();
            $table->string('shipping_district')->nullable();
            $table->string('shipping_street')->nullable();
            $table->string('shipping_building')->nullable();
            $table->string('shipping_apartment')->nullable();
            $table->decimal('subtotal', 12, 2);
            $table->decimal('shipping_total', 12, 2);
            $table->decimal('assembly_total', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('vat_amount', 12, 2);
            $table->decimal('grand_total', 12, 2);
            $table->string('idempotency_key', 64)->nullable();
            $table->string('idempotency_payload_hash', 64)->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['user_id', 'status']);
        });

        Schema::create('vendor_orders', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->constrained('orders')->cascadeOnDelete();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->restrictOnDelete();
            $table->string('status', 32);
            $table->decimal('subtotal', 12, 2);
            $table->string('shipping_method', 32);
            $table->decimal('shipping_cost', 12, 2);
            $table->string('pickup_location_label', 255)->nullable();
            $table->boolean('free_shipping_applied')->default(false);
            $table->decimal('assembly_cost', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('vat_amount', 12, 2);
            $table->decimal('vendor_total', 12, 2);
            $table->timestamps();

            $table->index(['vendor_account_id', 'status']);
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_order_id')->constrained('vendor_orders')->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained('products')->restrictOnDelete();
            $table->string('product_name');
            $table->string('product_slug')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->unsignedInteger('quantity');
            $table->decimal('line_subtotal', 12, 2);
            $table->string('color_name', 64)->nullable();
            $table->char('color_hex', 7)->nullable();
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('order_id')->unique()->constrained('orders')->cascadeOnDelete();
            $table->string('status', 32);
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_order_id')->unique()->constrained('vendor_orders')->cascadeOnDelete();
            $table->string('status', 32);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('vendor_orders');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('order_number_sequences');
    }
};
