<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_bookings', function (Blueprint $table) {
            $table->date('proposed_scheduled_date')->nullable()->after('scheduled_time');
            $table->string('proposed_scheduled_time', 8)->nullable()->after('proposed_scheduled_date');
            $table->timestamp('schedule_proposed_at')->nullable()->after('proposed_scheduled_time');
        });
    }

    public function down(): void
    {
        Schema::table('service_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'proposed_scheduled_date',
                'proposed_scheduled_time',
                'schedule_proposed_at',
            ]);
        });
    }
};
