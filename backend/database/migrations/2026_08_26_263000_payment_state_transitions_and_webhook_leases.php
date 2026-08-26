<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_state_transitions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('payment_id')->constrained('payments')->cascadeOnDelete();
            $table->string('from_status', 32);
            $table->string('to_status', 32);
            $table->string('source', 64);
            $table->string('correlation_id', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['payment_id', 'created_at']);
            $table->index('correlation_id');
        });

        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->unsignedSmallInteger('processing_attempts')->default(0)->after('processing_status');
            $table->timestamp('processing_leased_until')->nullable()->after('processing_attempts');
            $table->string('correlation_id', 64)->nullable()->after('processing_leased_until');
        });
    }

    public function down(): void
    {
        Schema::table('payment_webhook_events', function (Blueprint $table) {
            $table->dropColumn(['processing_attempts', 'processing_leased_until', 'correlation_id']);
        });

        Schema::dropIfExists('payment_state_transitions');
    }
};
