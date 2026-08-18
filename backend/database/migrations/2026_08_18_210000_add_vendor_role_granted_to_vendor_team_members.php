<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_team_members', function (Blueprint $table) {
            $table->boolean('vendor_role_granted')->default(false)->after('accepted_at');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_team_members', function (Blueprint $table) {
            $table->dropColumn('vendor_role_granted');
        });
    }
};
