<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_request_timelines', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('service_request_id')->constrained('service_requests')->cascadeOnDelete();
            $table->string('status');
            $table->string('actor_type')->nullable(); // 'customer', 'provider', 'system', 'admin'
            $table->foreignUuid('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['service_request_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_request_timelines');
    }
};
