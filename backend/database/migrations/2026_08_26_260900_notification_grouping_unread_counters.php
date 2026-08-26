<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->string('group_key', 191)->nullable()->after('dedupe_key');
            $table->unsignedSmallInteger('aggregated_count')->default(1)->after('group_key');
            $table->json('actor_snapshot')->nullable()->after('aggregated_count');

            $table->index(['user_id', 'group_key', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::table('user_notifications', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'group_key', 'read_at']);
            $table->dropColumn(['group_key', 'aggregated_count', 'actor_snapshot']);
        });
    }
};
