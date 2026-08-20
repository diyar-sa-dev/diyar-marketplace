<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->timestamp('inbox_hidden_at')->nullable()->after('left_at');
            $table->index(['user_id', 'inbox_hidden_at']);
        });
    }

    public function down(): void
    {
        Schema::table('conversation_participants', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'inbox_hidden_at']);
            $table->dropColumn('inbox_hidden_at');
        });
    }
};
