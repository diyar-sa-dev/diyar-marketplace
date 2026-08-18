<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('product_preorder_requests')) {
            return;
        }

        Schema::create('product_preorder_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('product_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('vendor_account_id')->constrained()->cascadeOnDelete();
            $table->json('selected_color')->nullable();
            $table->decimal('unit_price', 12, 2);
            $table->string('status')->default('pending');
            $table->timestamp('fulfilled_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();

            $table->index(['vendor_account_id', 'status', 'created_at'], 'preorder_vendor_status_created_idx');
            $table->index(['user_id', 'product_id'], 'preorder_user_product_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_preorder_requests');
    }
};
