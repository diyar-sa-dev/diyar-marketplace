<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('b2b_companies', function (Blueprint $table) {
            $table->string('custom_category')->nullable()->after('b2b_category_id');
        });
    }

    public function down(): void
    {
        Schema::table('b2b_companies', function (Blueprint $table) {
            $table->dropColumn('custom_category');
        });
    }
};
