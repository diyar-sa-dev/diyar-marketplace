<?php

namespace App\Models;

use App\Enums\ReturnShippingPaidBy;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorReturnPolicy extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'vendor_account_id',
        'returnable',
        'return_window_days',
        'accepted_reasons',
        'requires_unused',
        'requires_evidence',
        'return_shipping_paid_by',
        'shipping_refundable',
    ];

    protected function casts(): array
    {
        return [
            'returnable' => 'boolean',
            'return_window_days' => 'integer',
            'accepted_reasons' => 'array',
            'requires_unused' => 'boolean',
            'requires_evidence' => 'boolean',
            'return_shipping_paid_by' => ReturnShippingPaidBy::class,
            'shipping_refundable' => 'boolean',
        ];
    }

    public function vendorAccount(): BelongsTo
    {
        return $this->belongsTo(VendorAccount::class);
    }
}
