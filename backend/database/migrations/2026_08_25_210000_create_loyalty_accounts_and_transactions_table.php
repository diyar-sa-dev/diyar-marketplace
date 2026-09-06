<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('loyalty_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('balance')->default(0);
            $table->unsignedBigInteger('total_earned')->default(0);
            $table->unsignedBigInteger('total_redeemed')->default(0);
            $table->unsignedBigInteger('total_reversed')->default(0);
            $table->bigInteger('total_adjusted')->default(0);
            $table->timestamps();
        });

        Schema::create('loyalty_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('loyalty_account_id')->constrained('loyalty_accounts')->cascadeOnDelete();
            $table->string('type', 32);
            $table->integer('points');
            $table->unsignedBigInteger('balance_after');
            $table->string('reference')->unique();
            $table->string('source_type')->nullable();
            $table->uuid('source_id')->nullable();
            $table->foreignUuid('order_id')->nullable()->constrained()->nullOnDelete();
            $table->decimal('eligible_amount', 12, 2)->nullable();
            $table->text('reason')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['loyalty_account_id', 'created_at']);
            $table->index(['loyalty_account_id', 'type']);
            $table->index('order_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_accounts');
    }
};
