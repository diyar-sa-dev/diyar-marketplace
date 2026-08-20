<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            $table->string('retention_policy', 32)->default('standard')->after('last_message_at');
            $table->timestamp('retain_until')->nullable()->after('retention_policy');

            $table->index(['retention_policy', 'last_message_at']);
        });

        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('archived_at')->nullable()->after('idempotency_key');
            $table->uuid('archive_batch_id')->nullable()->after('archived_at');

            $table->index(['archived_at', 'created_at']);
            $table->index('archive_batch_id');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropIndex(['archived_at', 'created_at']);
            $table->dropIndex(['archive_batch_id']);
            $table->dropColumn(['archived_at', 'archive_batch_id']);
        });

        Schema::table('conversations', function (Blueprint $table) {
            $table->dropIndex(['retention_policy', 'last_message_at']);
            $table->dropColumn(['retention_policy', 'retain_until']);
        });
    }
};
