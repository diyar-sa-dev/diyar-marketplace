<?php

namespace App\Models;

use App\Enums\AffiliateCommissionStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AffiliateCommission extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'affiliate_profile_id',
        'affiliate_link_id',
        'affiliate_click_id',
        'traffic_source',
        'order_id',
        'order_item_id',
        'vendor_order_id',
        'product_id',
        'status',
        'commission_rate_percent',
        'commission_base_amount',
        'commission_amount',
        'currency',
        'idempotency_key',
        'available_at',
        'reversed_at',
        'affiliate_payout_id',
    ];

    protected function casts(): array
    {
        return [
            'status' => AffiliateCommissionStatus::class,
            'commission_rate_percent' => 'decimal:2',
            'commission_base_amount' => 'decimal:2',
            'commission_amount' => 'decimal:2',
            'available_at' => 'datetime',
            'reversed_at' => 'datetime',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(AffiliateProfile::class, 'affiliate_profile_id');
    }

    public function link(): BelongsTo
    {
        return $this->belongsTo(AffiliateLink::class, 'affiliate_link_id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(AffiliatePayout::class, 'affiliate_payout_id');
    }
}
