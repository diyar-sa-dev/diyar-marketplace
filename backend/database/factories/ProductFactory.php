<?php

namespace Database\Factories;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Enums\VendorAccountStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductColor;
use App\Models\ProductInventory;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Product> */
class ProductFactory extends Factory
{
    protected $model = Product::class;

    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'vendor_account_id' => function () {
                $user = User::factory()->create();

                return VendorAccount::query()->create([
                    'user_id' => $user->id,
                    'business_name' => fake()->company(),
                    'slug' => str()->slug(fake()->unique()->company()),
                    'status' => VendorAccountStatus::Active,
                ])->id;
            },
            'category_id' => Category::factory(),
            'name' => $name,
            'slug' => str()->slug($name),
            'description' => fake()->paragraph(),
            'sale_price' => fake()->randomFloat(2, 100, 5000),
            'compare_price' => fake()->optional()->randomFloat(2, 100, 6000),
            'width' => fake()->optional()->randomFloat(2, 10, 300),
            'height' => fake()->optional()->randomFloat(2, 10, 300),
            'depth' => fake()->optional()->randomFloat(2, 10, 300),
            'materials' => fake()->optional()->randomElements(['خشب', 'معدن', 'زجاج', 'قماش'], 2),
            'warranty' => fake()->optional()->randomElement(['سنة واحدة', 'سنتان']),
            'product_type' => ProductType::Single,
            'availability_mode' => AvailabilityMode::InStock,
            'status' => ProductStatus::Active,
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Product $product) {
            ProductColor::query()->create([
                'product_id' => $product->id,
                'name' => 'أبيض',
                'hex_code' => '#FFFFFF',
            ]);

            ProductInventory::query()->create([
                'product_id' => $product->id,
                'stock_quantity' => 10,
                'reserved_quantity' => 0,
                'available_quantity' => 10,
            ]);
        });
    }

    public function archived(): static
    {
        return $this->state(fn () => ['status' => ProductStatus::Archived]);
    }

    public function outOfStock(): static
    {
        return $this->state(fn () => ['availability_mode' => AvailabilityMode::OutOfStock]);
    }
}
