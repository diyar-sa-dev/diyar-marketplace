<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('idempotency_key', 128);
            $table->string('status', 32);
            $table->string('gateway_session_id', 128)->nullable();
            $table->string('gateway_payment_id', 64)->nullable();
            $table->string('gateway_invoice_id', 64)->nullable();
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3);
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['payment_id', 'idempotency_key']);
            $table->index('gateway_session_id');
            $table->index('gateway_payment_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
    }
};
