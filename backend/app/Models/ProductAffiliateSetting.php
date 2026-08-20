<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductAffiliateSetting extends Model
{
    use HasUuids;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'product_id',
        'enabled',
        'commission_min_percent',
        'commission_max_percent',
        'commission_rate_percent',
    ];

    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'commission_min_percent' => 'decimal:2',
            'commission_max_percent' => 'decimal:2',
            'commission_rate_percent' => 'decimal:2',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
