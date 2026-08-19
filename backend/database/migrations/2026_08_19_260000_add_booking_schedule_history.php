<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_bookings', function (Blueprint $table) {
            $table->date('requested_scheduled_date')->nullable()->after('scheduled_time');
            $table->string('requested_scheduled_time', 8)->nullable()->after('requested_scheduled_date');
            $table->date('last_proposed_scheduled_date')->nullable()->after('schedule_proposed_at');
            $table->string('last_proposed_scheduled_time', 8)->nullable()->after('last_proposed_scheduled_date');
        });

        DB::table('service_bookings')
            ->whereNull('requested_scheduled_date')
            ->update([
                'requested_scheduled_date' => DB::raw('scheduled_date'),
                'requested_scheduled_time' => DB::raw('scheduled_time'),
            ]);

        DB::table('service_bookings')
            ->whereNotNull('schedule_proposed_at')
            ->whereNull('last_proposed_scheduled_date')
            ->update([
                'last_proposed_scheduled_date' => DB::raw('COALESCE(proposed_scheduled_date, scheduled_date)'),
                'last_proposed_scheduled_time' => DB::raw('COALESCE(proposed_scheduled_time, scheduled_time)'),
            ]);
    }

    public function down(): void
    {
        Schema::table('service_bookings', function (Blueprint $table) {
            $table->dropColumn([
                'requested_scheduled_date',
                'requested_scheduled_time',
                'last_proposed_scheduled_date',
                'last_proposed_scheduled_time',
            ]);
        });
    }
};
