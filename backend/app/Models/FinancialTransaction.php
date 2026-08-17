<?php

namespace App\Models;

use App\Enums\BalanceBucket;
use App\Enums\FinancialDirection;
use App\Enums\FinancialTransactionType;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancialTransaction extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'reference',
        'transaction_type',
        'source_type',
        'source_id',
        'vendor_account_id',
        'order_id',
        'payment_id',
        'payment_vendor_allocation_id',
        'vendor_payout_id',
        'amount',
        'currency',
        'direction',
        'balance_bucket',
        'description',
        'metadata',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'transaction_type' => FinancialTransactionType::class,
            'direction' => FinancialDirection::class,
            'balance_bucket' => BalanceBucket::class,
            'amount' => 'decimal:2',
            'metadata' => 'array',
        ];
    }

    protected static function booted(): void
    {
        static::updating(static fn () => throw new \RuntimeException('Financial transactions are immutable.'));
        static::deleting(static fn () => throw new \RuntimeException('Financial transactions are immutable.'));
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function paymentVendorAllocation(): BelongsTo
    {
        return $this->belongsTo(PaymentVendorAllocation::class);
    }

    public function vendorPayout(): BelongsTo
    {
        return $this->belongsTo(VendorPayout::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}
