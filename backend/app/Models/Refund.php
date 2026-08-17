<?php

namespace App\Models;

use App\Enums\RefundStatus;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Refund extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'reference',
        'return_request_id',
        'order_id',
        'vendor_order_id',
        'payment_id',
        'payment_vendor_allocation_id',
        'status',
        'items_subtotal',
        'vat_amount',
        'shipping_amount',
        'total_amount',
        'vendor_payable_reversal',
        'commission_reversal',
        'currency',
        'gateway_refund_id',
        'idempotency_key',
        'processed_at',
        'breakdown',
    ];

    protected function casts(): array
    {
        return [
            'status' => RefundStatus::class,
            'items_subtotal' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'shipping_amount' => 'decimal:2',
            'total_amount' => 'decimal:2',
            'vendor_payable_reversal' => 'decimal:2',
            'commission_reversal' => 'decimal:2',
            'processed_at' => 'datetime',
            'breakdown' => 'array',
        ];
    }

    public function returnRequest(): BelongsTo
    {
        return $this->belongsTo(ReturnRequest::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function allocation(): BelongsTo
    {
        return $this->belongsTo(PaymentVendorAllocation::class, 'payment_vendor_allocation_id');
    }
}
