<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_offers', function (Blueprint $table) {
            $table->date('proposed_scheduled_date')->nullable()->after('duration_days');
            $table->string('proposed_scheduled_time', 5)->nullable()->after('proposed_scheduled_date');
        });
    }

    public function down(): void
    {
        Schema::table('service_offers', function (Blueprint $table) {
            $table->dropColumn(['proposed_scheduled_date', 'proposed_scheduled_time']);
        });
    }
};
