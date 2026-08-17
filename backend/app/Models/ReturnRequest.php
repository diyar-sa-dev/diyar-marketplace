<?php

namespace App\Models;

use App\Enums\ReturnReason;
use App\Enums\ReturnRequestStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class ReturnRequest extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'reference',
        'order_id',
        'vendor_order_id',
        'user_id',
        'status',
        'reason',
        'customer_note',
        'vendor_note',
        'submitted_at',
        'reviewed_at',
        'approved_at',
        'rejected_at',
        'received_at',
        'inspected_at',
        'refunded_at',
        'cancelled_at',
        'policy_snapshot',
    ];

    protected function casts(): array
    {
        return [
            'status' => ReturnRequestStatus::class,
            'reason' => ReturnReason::class,
            'submitted_at' => 'datetime',
            'reviewed_at' => 'datetime',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'received_at' => 'datetime',
            'inspected_at' => 'datetime',
            'refunded_at' => 'datetime',
            'cancelled_at' => 'datetime',
            'policy_snapshot' => 'array',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ReturnItem::class);
    }

    public function evidence(): HasMany
    {
        return $this->hasMany(ReturnEvidence::class);
    }

    public function refund(): HasOne
    {
        return $this->hasOne(Refund::class);
    }
}
