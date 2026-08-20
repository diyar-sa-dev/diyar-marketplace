<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type', 32);
            $table->string('subject')->nullable();
            $table->string('context_type', 64)->nullable();
            $table->uuid('context_id')->nullable();
            $table->foreignUuid('vendor_account_id')->nullable()->constrained('vendor_accounts')->nullOnDelete();
            $table->foreignUuid('provider_account_id')->nullable()->constrained('provider_accounts')->nullOnDelete();
            $table->foreignUuid('created_by')->constrained('users')->cascadeOnDelete();
            $table->uuid('last_message_id')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'last_message_at']);
            $table->index(['context_type', 'context_id']);
        });

        Schema::create('conversation_participants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('participant_role', 32);
            $table->unsignedInteger('unread_count')->default(0);
            $table->timestamp('last_read_at')->nullable();
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamp('left_at')->nullable();
            $table->timestamps();

            $table->unique(['conversation_id', 'user_id']);
            $table->index(['user_id', 'left_at']);
        });

        Schema::create('messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('conversations')->cascadeOnDelete();
            $table->foreignUuid('sender_id')->constrained('users')->cascadeOnDelete();
            $table->text('body')->nullable();
            $table->string('message_type', 32)->default('text');
            $table->string('idempotency_key', 128)->nullable();
            $table->timestamps();

            $table->unique(['conversation_id', 'idempotency_key']);
            $table->index(['conversation_id', 'created_at', 'id']);
            $table->index('sender_id');
        });

        Schema::create('message_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('message_id')->constrained('messages')->cascadeOnDelete();
            $table->string('disk', 32);
            $table->string('path');
            $table->string('original_name');
            $table->string('mime_type', 128);
            $table->unsignedBigInteger('size_bytes');
            $table->timestamps();

            $table->index('message_id');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->foreign('last_message_id')->references('id')->on('messages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->dropForeign(['last_message_id']);
        });

        Schema::dropIfExists('message_attachments');
        Schema::dropIfExists('messages');
        Schema::dropIfExists('conversation_participants');
        Schema::dropIfExists('conversations');
    }
};
