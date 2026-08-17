<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 64)->unique();
            $table->foreignUuid('vendor_account_id')->constrained('vendor_accounts')->cascadeOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->string('status', 32);
            $table->timestamp('requested_at');
            $table->timestamp('processed_at')->nullable();
            $table->foreignUuid('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('rejection_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['vendor_account_id', 'status']);
            $table->index(['status', 'requested_at']);
        });

        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->foreign('vendor_payout_id')
                ->references('id')
                ->on('vendor_payouts')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->dropForeign(['vendor_payout_id']);
        });

        Schema::dropIfExists('vendor_payouts');
    }
};
