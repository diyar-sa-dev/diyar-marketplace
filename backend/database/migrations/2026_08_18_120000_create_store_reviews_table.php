<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_reviews', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('vendor_account_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('order_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('vendor_order_id')->constrained()->cascadeOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('comment')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'vendor_account_id', 'order_id']);
            $table->index(['vendor_account_id', 'created_at']);
            $table->index('order_id');
            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_reviews');
    }
};
