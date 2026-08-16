<?php

namespace Database\Factories;

use App\Models\Product;
use App\Models\ProductInventory;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ProductInventory> */
class ProductInventoryFactory extends Factory
{
    protected $model = ProductInventory::class;

    public function definition(): array
    {
        $stock = fake()->numberBetween(0, 50);

        return [
            'product_id' => Product::factory(),
            'stock_quantity' => $stock,
            'reserved_quantity' => 0,
            'available_quantity' => $stock,
        ];
    }

    public function withReserved(int $reserved): static
    {
        return $this->state(function (array $attributes) use ($reserved) {
            $stock = $attributes['stock_quantity'] ?? 10;
            $reserved = min($reserved, $stock);

            return [
                'stock_quantity' => $stock,
                'reserved_quantity' => $reserved,
                'available_quantity' => max(0, $stock - $reserved),
            ];
        });
    }
}
