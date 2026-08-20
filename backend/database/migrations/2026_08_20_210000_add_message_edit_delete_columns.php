<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->timestamp('edited_at')->nullable()->after('idempotency_key');
            $table->timestamp('deleted_at')->nullable()->after('edited_at');
            $table->foreignUuid('reply_to_message_id')->nullable()->after('deleted_at');

            $table->foreign('reply_to_message_id')->references('id')->on('messages')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropForeign(['reply_to_message_id']);
            $table->dropColumn(['edited_at', 'deleted_at', 'reply_to_message_id']);
        });
    }
};
