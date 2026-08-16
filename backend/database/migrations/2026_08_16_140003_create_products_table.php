<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->foreignUuid('category_id')->constrained('categories')->restrictOnDelete();
            $table->string('name');
            $table->string('slug');
            $table->text('description')->nullable();
            $table->decimal('sale_price', 12, 2);
            $table->decimal('compare_price', 12, 2)->nullable();
            $table->decimal('width', 8, 2)->nullable();
            $table->decimal('height', 8, 2)->nullable();
            $table->decimal('depth', 8, 2)->nullable();
            $table->json('materials')->nullable();
            $table->string('warranty')->nullable();
            $table->string('product_type')->default('single');
            $table->string('availability_mode')->default('in_stock');
            $table->string('status')->default('active');
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['vendor_account_id', 'slug']);
            $table->index(['category_id', 'status']);
            $table->index(['vendor_account_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
