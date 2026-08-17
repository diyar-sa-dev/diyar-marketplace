<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_webhook_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('gateway', 32);
            $table->string('event_type', 64);
            $table->string('webhook_version', 8)->nullable();
            $table->boolean('signature_valid')->default(false);
            $table->string('payload_hash', 64)->unique();
            $table->json('payload');
            $table->string('processing_status', 32)->default('pending');
            $table->foreignUuid('payment_id')->nullable()->constrained('payments')->nullOnDelete();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->index(['gateway', 'processing_status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhook_events');
    }
};
