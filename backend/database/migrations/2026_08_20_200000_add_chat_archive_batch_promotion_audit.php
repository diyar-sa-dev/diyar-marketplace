<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_archive_batches', function (Blueprint $table) {
            $table->string('promoted_by')->nullable()->after('safe_to_purge_at');
            $table->string('promoted_via', 64)->nullable()->after('promoted_by');
            $table->text('promotion_note')->nullable()->after('promoted_via');
        });
    }

    public function down(): void
    {
        Schema::table('chat_archive_batches', function (Blueprint $table) {
            $table->dropColumn(['promoted_by', 'promoted_via', 'promotion_note']);
        });
    }
};
