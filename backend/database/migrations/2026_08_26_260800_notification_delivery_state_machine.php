<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->string('provider', 64)->nullable()->after('channel');
            $table->string('failure_code', 64)->nullable()->after('last_error');
            $table->string('failure_category', 32)->nullable()->after('failure_code');
            $table->string('provider_message_id', 191)->nullable()->after('failure_category');
            $table->uuid('correlation_id')->nullable()->after('provider_message_id');
            $table->timestamp('last_attempt_at')->nullable()->after('attempts');
            $table->timestamp('next_retry_at')->nullable()->after('last_attempt_at');
            $table->timestamp('failed_at')->nullable()->after('delivered_at');

            $table->index(['status', 'next_retry_at']);
            $table->index(['status', 'updated_at']);
        });

        Schema::table('notification_broadcasts', function (Blueprint $table) {
            $table->unsignedInteger('queued_recipients')->default(0)->after('processed_recipients');
            $table->unsignedInteger('delivered_recipients')->default(0)->after('queued_recipients');
            $table->unsignedInteger('failed_recipients')->default(0)->after('delivered_recipients');
            $table->unsignedInteger('suppressed_recipients')->default(0)->after('failed_recipients');
        });
    }

    public function down(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->dropIndex(['status', 'next_retry_at']);
            $table->dropIndex(['status', 'updated_at']);
            $table->dropColumn([
                'provider',
                'failure_code',
                'failure_category',
                'provider_message_id',
                'correlation_id',
                'last_attempt_at',
                'next_retry_at',
                'failed_at',
            ]);
        });

        Schema::table('notification_broadcasts', function (Blueprint $table) {
            $table->dropColumn([
                'queued_recipients',
                'delivered_recipients',
                'failed_recipients',
                'suppressed_recipients',
            ]);
        });
    }
};
