<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('chat_message_reports', function (Blueprint $table) {
            $table->foreignUuid('reviewed_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
            $table->string('resolution_note', 1000)->nullable()->after('reviewed_at');
            $table->string('action_taken', 64)->nullable()->after('resolution_note');
        });

        if (Schema::getConnection()->getDriverName() === 'mysql') {
            DB::table('chat_message_reports')->where('status', 'reviewed')->update(['status' => 'under_review']);
        }
    }

    public function down(): void
    {
        Schema::table('chat_message_reports', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reviewed_by');
            $table->dropColumn(['reviewed_at', 'resolution_note', 'action_taken']);
        });
    }
};
