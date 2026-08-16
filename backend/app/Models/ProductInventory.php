<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductInventory extends Model
{
    use HasFactory, HasUuids;

    protected $table = 'product_inventory';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'product_id',
        'stock_quantity',
        'reserved_quantity',
        'available_quantity',
    ];

    protected function casts(): array
    {
        return [
            'stock_quantity' => 'integer',
            'reserved_quantity' => 'integer',
            'available_quantity' => 'integer',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function computeAvailableQuantity(): int
    {
        return max(0, $this->stock_quantity - $this->reserved_quantity);
    }

    public function syncAvailableQuantity(): self
    {
        $available = $this->computeAvailableQuantity();

        if ($this->available_quantity !== $available) {
            $this->available_quantity = $available;
            $this->save();
        }

        return $this;
    }

    public function assertInvariants(): void
    {
        if ($this->stock_quantity < 0 || $this->reserved_quantity < 0) {
            throw new \InvalidArgumentException(__('diyar.catalog.negative_inventory'));
        }

        if ($this->reserved_quantity > $this->stock_quantity) {
            throw new \InvalidArgumentException(__('diyar.catalog.over_reserved'));
        }

        if ($this->available_quantity !== $this->computeAvailableQuantity()) {
            throw new \InvalidArgumentException(__('diyar.catalog.inventory_invariant_violation'));
        }
    }
}
