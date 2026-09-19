<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('try_in_room_jobs', function (Blueprint $table) {
            $table->string('provider_key', 32)->nullable()->after('status');
            $table->json('provider_metadata')->nullable()->after('result');
        });
    }

    public function down(): void
    {
        Schema::table('try_in_room_jobs', function (Blueprint $table) {
            $table->dropColumn(['provider_key', 'provider_metadata']);
        });
    }
};
