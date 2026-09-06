<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('b2b_companies', function (Blueprint $table) {
            $table->string('business_hours')->nullable()->after('website');
        });
    }

    public function down(): void
    {
        Schema::table('b2b_companies', function (Blueprint $table) {
            $table->dropColumn('business_hours');
        });
    }
};
