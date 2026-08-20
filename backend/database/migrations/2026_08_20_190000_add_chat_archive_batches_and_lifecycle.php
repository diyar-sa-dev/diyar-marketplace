<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_archive_batches', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->unsignedInteger('message_count')->default(0);
            $table->string('checksum', 128);
            $table->string('storage_disk', 32)->default('local');
            $table->string('storage_location');
            $table->string('status', 32)->default('archiving');
            $table->text('error_message')->nullable();
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('uploaded_at')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('safe_to_purge_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->string('lifecycle_status', 32)->default('active')->after('retention_policy');
            $table->index(['lifecycle_status', 'last_message_at']);
        });

        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->timestamp('last_delivered_at')->nullable()->after('last_read_at');
        });
    }

    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->dropColumn('last_delivered_at');
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['lifecycle_status', 'last_message_at']);
            $table->dropColumn('lifecycle_status');
        });

        Schema::dropIfExists('chat_archive_batches');
    }
};
