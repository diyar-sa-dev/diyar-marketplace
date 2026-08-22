<?php

namespace Database\Seeders;

use App\Enums\ProductStatus;
use App\Enums\RoleName;
use App\Enums\RoleStatus;
use App\Enums\UserStatus;
use App\Models\Product;
use App\Models\ProductLike;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;

class HomeEngagementSeeder extends Seeder
{
    public function run(): void
    {
        $customerRole = Role::query()->where('name', RoleName::Customer->value)->firstOrFail();

        $customers = collect(range(1, 12))->map(function (int $index) use ($customerRole): User {
            $phone = '96650001'.str_pad((string) $index, 4, '0', STR_PAD_LEFT);

            $user = User::query()->firstOrCreate(
                ['phone' => $phone],
                [
                    'name' => 'Demo Customer '.$index,
                    'email' => 'customer'.$index.'@diyar.local',
                    'email_verified_at' => now(),
                    'password' => 'Password123!',
                    'status' => UserStatus::Active,
                    'phone_verified_at' => now(),
                ],
            );

            if (! $user->roles()->where('roles.id', $customerRole->id)->exists()) {
                $user->roles()->attach($customerRole->id, [
                    'id' => (string) str()->uuid(),
                    'status' => RoleStatus::Active->value,
                ]);
            }

            return $user;
        });

        $products = Product::query()
            ->where('status', ProductStatus::Active)
            ->orderBy('created_at')
            ->get();

        foreach ($products as $index => $product) {
            $targetLikes = max(1, 24 - ($index % 20));

            foreach ($customers->take(min($targetLikes, $customers->count())) as $customer) {
                ProductLike::query()->firstOrCreate([
                    'user_id' => $customer->id,
                    'product_id' => $product->id,
                ]);
            }
        }
    }
}
