<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_query_events', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('query', 120);
            $table->string('normalized_query', 120);
            $table->string('search_type', 32)->default('catalog');
            $table->unsignedSmallInteger('result_count')->default(0);
            $table->uuid('user_id')->nullable()->index();
            $table->string('session_id', 64)->nullable()->index();
            $table->string('locale', 8)->nullable();
            $table->string('source', 32)->default('api');
            $table->json('filters')->nullable();
            $table->unsignedInteger('duration_ms')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['normalized_query', 'created_at']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('search_query_events');
    }
};
