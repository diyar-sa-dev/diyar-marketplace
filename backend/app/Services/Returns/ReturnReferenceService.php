<?php

namespace App\Services\Returns;

use Illuminate\Support\Facades\DB;

final class ReturnReferenceService
{
    public function nextReturnReference(): string
    {
        return DB::transaction(function () {
            $date = now()->format('Ymd');
            $sequence = DB::table('return_number_sequences')
                ->where('date', $date)
                ->lockForUpdate()
                ->first();

            if ($sequence === null) {
                DB::table('return_number_sequences')->insert([
                    'date' => $date,
                    'last_sequence' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $next = 1;
            } else {
                $next = ((int) $sequence->last_sequence) + 1;
                DB::table('return_number_sequences')
                    ->where('date', $date)
                    ->update(['last_sequence' => $next, 'updated_at' => now()]);
            }

            return sprintf('RTN-%s-%06d', $date, $next);
        });
    }

    public function nextRefundReference(): string
    {
        return DB::transaction(function () {
            $date = now()->format('Ymd');
            $sequence = DB::table('refund_number_sequences')
                ->where('date', $date)
                ->lockForUpdate()
                ->first();

            if ($sequence === null) {
                DB::table('refund_number_sequences')->insert([
                    'date' => $date,
                    'last_sequence' => 1,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $next = 1;
            } else {
                $next = ((int) $sequence->last_sequence) + 1;
                DB::table('refund_number_sequences')
                    ->where('date', $date)
                    ->update(['last_sequence' => $next, 'updated_at' => now()]);
            }

            return sprintf('RFD-%s-%06d', $date, $next);
        });
    }
}
