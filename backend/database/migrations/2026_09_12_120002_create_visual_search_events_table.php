<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visual_search_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('search_id');
            $table->string('event_type', 32);
            $table->timestamp('occurred_at');
            $table->char('query_fingerprint', 64);
            $table->foreignUuid('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->unsignedSmallInteger('rank_position')->nullable();
            $table->decimal('similarity_score', 5, 4)->nullable();
            $table->string('engine_version', 32);
            $table->string('representation_version', 32);
            $table->string('ranking_version', 32);
            $table->string('index_version', 64);
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_key', 64)->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['search_id', 'occurred_at'], 'idx_vse_search');
            $table->index(['product_id', 'event_type', 'occurred_at'], 'idx_vse_product');
            $table->index(['query_fingerprint', 'occurred_at'], 'idx_vse_fingerprint');
            $table->index(['event_type', 'occurred_at'], 'idx_vse_type_time');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visual_search_events');
    }
};
