<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->timestamp('claimed_at')->nullable()->after('last_attempt_at');
            $table->uuid('processing_token')->nullable()->after('claimed_at');
            $table->timestamp('processing_lease_until')->nullable()->after('processing_token');

            $table->index(['status', 'processing_lease_until'], 'notification_deliveries_status_lease_idx');
            $table->index(['status', 'next_retry_at'], 'notification_deliveries_status_retry_idx');
        });
    }

    public function down(): void
    {
        Schema::table('notification_deliveries', function (Blueprint $table) {
            $table->dropIndex('notification_deliveries_status_lease_idx');
            $table->dropIndex('notification_deliveries_status_retry_idx');
            $table->dropColumn(['claimed_at', 'processing_token', 'processing_lease_until']);
        });
    }
};
