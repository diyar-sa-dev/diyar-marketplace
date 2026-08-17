<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('financial_transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 64)->unique();
            $table->string('transaction_type', 32);
            $table->string('source_type', 64);
            $table->uuid('source_id');
            $table->foreignUuid('vendor_account_id')->nullable()->constrained('vendor_accounts')->nullOnDelete();
            $table->foreignUuid('order_id')->nullable()->constrained('orders')->nullOnDelete();
            $table->foreignUuid('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->foreignUuid('payment_vendor_allocation_id')->nullable()->constrained('payment_vendor_allocations')->nullOnDelete();
            $table->foreignUuid('vendor_payout_id')->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->string('direction', 8);
            $table->string('balance_bucket', 32);
            $table->string('description')->nullable();
            $table->json('metadata')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(
                ['source_type', 'source_id', 'transaction_type', 'balance_bucket', 'direction'],
                'financial_transactions_idempotency_unique',
            );

            $table->index(['vendor_account_id', 'created_at']);
            $table->index(['payment_id', 'transaction_type']);
            $table->index(['order_id']);
            $table->index(['balance_bucket', 'vendor_account_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('financial_transactions');
    }
};
