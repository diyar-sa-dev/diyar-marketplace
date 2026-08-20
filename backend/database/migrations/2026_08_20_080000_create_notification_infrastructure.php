<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 64);
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->string('entity_type', 64)->nullable();
            $table->uuid('entity_id')->nullable();
            $table->string('priority', 16)->default('normal');
            $table->string('dedupe_key', 191)->nullable();
            $table->timestamp('read_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['user_id', 'read_at', 'created_at']);
            $table->index(['user_id', 'created_at']);
            $table->index(['entity_type', 'entity_id']);
        });

        Schema::create('notification_deliveries', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_notification_id')->nullable()->constrained('user_notifications')->nullOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('channel', 32);
            $table->string('status', 32)->default('pending');
            $table->string('dedupe_key', 191);
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->text('last_error')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->unique('dedupe_key');
            $table->index(['user_id', 'channel', 'status']);
        });

        Schema::create('notification_devices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token', 512);
            $table->string('platform', 32);
            $table->string('device_identifier', 191)->nullable();
            $table->boolean('active')->default(true);
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'token']);
            $table->index(['user_id', 'active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_devices');
        Schema::dropIfExists('notification_deliveries');
        Schema::dropIfExists('user_notifications');
    }
};
