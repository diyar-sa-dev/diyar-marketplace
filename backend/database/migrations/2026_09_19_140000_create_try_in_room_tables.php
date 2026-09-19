<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('try_in_room_source_images', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('disk', 32);
            $table->string('path', 512);
            $table->string('mime', 64);
            $table->unsignedInteger('width_px');
            $table->unsignedInteger('height_px');
            $table->unsignedInteger('size_bytes');
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        Schema::create('try_in_room_jobs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('source_image_id')->constrained('try_in_room_source_images')->cascadeOnDelete();
            $table->uuid('product_id')->nullable();
            $table->uuid('room_design_id')->nullable();
            $table->string('idempotency_key', 128)->nullable();
            $table->string('status', 32);
            $table->string('error_code', 64)->nullable();
            $table->json('result')->nullable();
            $table->unsignedSmallInteger('attempts')->default(0);
            $table->timestamp('queued_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'idempotency_key']);
            $table->index(['user_id', 'status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('try_in_room_jobs');
        Schema::dropIfExists('try_in_room_source_images');
    }
};
