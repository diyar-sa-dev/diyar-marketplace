<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StoreReview extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'vendor_account_id',
        'order_id',
        'vendor_order_id',
        'rating',
        'comment',
        'vendor_reply',
        'vendor_replied_at',
        'vendor_replied_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'rating' => 'integer',
            'vendor_replied_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function vendorRepliedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_replied_by_user_id');
    }
}
