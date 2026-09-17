<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('session_lookup_hash', 64);
            $table->text('laravel_session_id');
            $table->string('device_type', 32)->nullable();
            $table->string('browser', 64)->nullable();
            $table->string('browser_version', 32)->nullable();
            $table->string('platform', 64)->nullable();
            $table->string('platform_version', 32)->nullable();
            $table->string('device_name', 128)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('country', 64)->nullable();
            $table->string('city', 128)->nullable();
            $table->string('region', 128)->nullable();
            $table->string('location_source', 32)->nullable();
            $table->timestamp('first_seen_at');
            $table->timestamp('last_activity_at');
            $table->timestamp('revoked_at')->nullable();
            $table->timestamps();

            $table->unique('session_lookup_hash');
            $table->index(['user_id', 'revoked_at']);
            $table->index(['user_id', 'last_activity_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_sessions');
    }
};
