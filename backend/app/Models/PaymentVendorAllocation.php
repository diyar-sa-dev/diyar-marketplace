<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentVendorAllocation extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'payment_id',
        'payment_attempt_id',
        'vendor_order_id',
        'vendor_account_id',
        'vendor_name',
        'vendor_subtotal',
        'shipping_cost',
        'assembly_cost',
        'discount_amount',
        'vat_amount',
        'vendor_gross_total',
        'platform_commission_amount',
        'vendor_payable_amount',
        'currency',
    ];

    protected function casts(): array
    {
        return [
            'vendor_subtotal' => 'decimal:2',
            'shipping_cost' => 'decimal:2',
            'assembly_cost' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'vendor_gross_total' => 'decimal:2',
            'platform_commission_amount' => 'decimal:2',
            'vendor_payable_amount' => 'decimal:2',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function paymentAttempt(): BelongsTo
    {
        return $this->belongsTo(PaymentAttempt::class);
    }

    public function vendorOrder(): BelongsTo
    {
        return $this->belongsTo(VendorOrder::class);
    }
}
