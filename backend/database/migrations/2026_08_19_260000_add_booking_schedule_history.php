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

        $this->backfillRequestedSchedule();
        $this->backfillLastProposedSchedule();
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

    private function backfillRequestedSchedule(): void
    {
        DB::table('service_bookings')
            ->whereNull('requested_scheduled_date')
            ->select(['id', 'scheduled_date', 'scheduled_time'])
            ->orderBy('id')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    DB::table('service_bookings')
                        ->where('id', $row->id)
                        ->update([
                            'requested_scheduled_date' => $row->scheduled_date,
                            'requested_scheduled_time' => $this->formatTimeValue($row->scheduled_time),
                        ]);
                }
            });
    }

    private function backfillLastProposedSchedule(): void
    {
        DB::table('service_bookings')
            ->whereNotNull('schedule_proposed_at')
            ->whereNull('last_proposed_scheduled_date')
            ->select([
                'id',
                'proposed_scheduled_date',
                'proposed_scheduled_time',
                'scheduled_date',
                'scheduled_time',
            ])
            ->orderBy('id')
            ->chunkById(200, function ($rows): void {
                foreach ($rows as $row) {
                    DB::table('service_bookings')
                        ->where('id', $row->id)
                        ->update([
                            'last_proposed_scheduled_date' => $row->proposed_scheduled_date ?? $row->scheduled_date,
                            'last_proposed_scheduled_time' => $row->proposed_scheduled_time
                                ?? $this->formatTimeValue($row->scheduled_time),
                        ]);
                }
            });
    }

    private function formatTimeValue(mixed $time): ?string
    {
        if ($time === null) {
            return null;
        }

        if ($time instanceof \DateTimeInterface) {
            return $time->format('H:i:s');
        }

        $value = trim((string) $time);

        return $value === '' ? null : $value;
    }
};
