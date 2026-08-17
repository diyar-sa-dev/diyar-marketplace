<?php

namespace App\Services\Order;

use App\Models\OrderNumberSequence;
use Illuminate\Support\Facades\DB;

final class OrderNumberService
{
    public function allocate(): string
    {
        return DB::transaction(function () {
            $date = now()->format('Ymd');

            $sequence = OrderNumberSequence::query()
                ->where('date', $date)
                ->lockForUpdate()
                ->first();

            if ($sequence === null) {
                $sequence = OrderNumberSequence::query()->create([
                    'date' => $date,
                    'last_sequence' => 0,
                ]);

                $sequence = OrderNumberSequence::query()
                    ->where('date', $date)
                    ->lockForUpdate()
                    ->firstOrFail();
            }

            $next = $sequence->last_sequence + 1;
            $sequence->update(['last_sequence' => $next]);

            return sprintf('DYR-%s-%06d', $date, $next);
        });
    }
}
