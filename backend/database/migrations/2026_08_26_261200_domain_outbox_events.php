<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('domain_outbox_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('aggregate_type', 64);
            $table->uuid('aggregate_id');
            $table->string('event_type', 128);
            $table->json('payload');
            $table->timestamp('occurred_at')->useCurrent();
            $table->timestamp('available_at')->useCurrent();
            $table->string('status', 32)->default('pending');
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('locked_at')->nullable();
            $table->string('locked_by', 64)->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->text('last_error')->nullable();
            $table->uuid('correlation_id')->nullable();
            $table->string('idempotency_key', 191)->nullable();
            $table->timestamps();

            $table->unique(['idempotency_key'], 'domain_outbox_events_idempotency_unique');
            $table->index(['status', 'available_at'], 'domain_outbox_events_status_available_idx');
            $table->index(['aggregate_type', 'aggregate_id'], 'domain_outbox_events_aggregate_idx');
            $table->index(['event_type', 'status'], 'domain_outbox_events_type_status_idx');
            $table->index(['locked_at'], 'domain_outbox_events_locked_at_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('domain_outbox_events');
    }
};
