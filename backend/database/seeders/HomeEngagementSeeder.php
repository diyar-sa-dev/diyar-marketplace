<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\ProductLike;
use App\Models\User;
use Illuminate\Database\Seeder;

class HomeEngagementSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $customer = User::query()->where('email', 'customer@diyar.local')->first();
        if ($customer === null) {
            return;
        }

        $products = Product::query()
            ->where('status', ProductStatus::Active)
            ->orderBy('created_at')
            ->limit(6)
            ->get();

        foreach ($products as $product) {
            ProductLike::query()->firstOrCreate([
                'user_id' => $customer->id,
                'product_id' => $product->id,
            ]);
        }
    }
}
