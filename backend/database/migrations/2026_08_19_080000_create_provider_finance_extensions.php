<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('provider_bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->string('bank_code');
            $table->string('beneficiary_name');
            $table->string('iban');
            $table->string('iban_last4', 4);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['provider_account_id', 'is_active']);
        });

        Schema::create('provider_payouts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference')->unique();
            $table->foreignUuid('provider_account_id')->constrained('provider_accounts')->cascadeOnDelete();
            $table->foreignUuid('provider_bank_account_id')->nullable()->constrained('provider_bank_accounts')->nullOnDelete();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('SAR');
            $table->string('status');
            $table->timestamp('requested_at');
            $table->timestamp('processed_at')->nullable();
            $table->foreignUuid('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('rejection_reason')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['provider_account_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('provider_payouts');
        Schema::dropIfExists('provider_bank_accounts');
    }
};
