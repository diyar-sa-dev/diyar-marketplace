<?php

namespace App\Models;

use App\Enums\Weekday;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorWorkingHour extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'day',
        'is_closed',
        'opens_at',
        'closes_at',
        'closes_next_day',
    ];

    protected function casts(): array
    {
        return [
            'day' => Weekday::class,
            'is_closed' => 'boolean',
            'closes_next_day' => 'boolean',
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }
}
