<?php

namespace Database\Seeders;

use App\Enums\OrderStatus;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Enums\UserStatus;
use App\Models\Category;
use App\Models\Product;
use App\Models\User;
use App\Models\VendorAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Stage 28.7 — Controlled performance dataset scaling (measurement only).
 *
 * Env: DIYAR_PERF_DATASET_SCALE = 1 | 10 | 100 (default 10 after base seed)
 * Run after DatabaseSeeder on isolated load-test DB only.
 */
class PerformanceDatasetSeeder extends Seeder
{
    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $scale = max(1, min(100, (int) env('DIYAR_PERF_DATASET_SCALE', 10)));
        if ($scale <= 1) {
            $this->command?->info('PerformanceDatasetSeeder: scale=1 — no extra rows.');

            return;
        }

        $vendor = VendorAccount::query()->where('slug', 'diyar-furniture')->first()
            ?? VendorAccount::query()->first();

        if ($vendor === null) {
            $this->command?->warn('PerformanceDatasetSeeder: no vendor — skipping.');

            return;
        }

        $category = Category::query()->first();
        if ($category === null) {
            $this->command?->warn('PerformanceDatasetSeeder: no category — skipping.');

            return;
        }

        $targetProducts = min(10000, 100 * $scale);
        $targetUsers = min(10000, 20 * $scale);
        $targetOrders = min(10000, 100 * $scale);
        $itemsPerOrder = 3;

        $existingProducts = Product::query()->count();
        $productsToCreate = max(0, $targetProducts - $existingProducts);
        $existingUsers = User::query()->count();
        $usersToCreate = max(0, $targetUsers - $existingUsers);
        $existingOrders = DB::table('orders')->count();
        $ordersToCreate = max(0, $targetOrders - $existingOrders);

        $this->command?->info("PerformanceDatasetSeeder scale={$scale}: +{$productsToCreate} products, +{$usersToCreate} users, +{$ordersToCreate} orders");

        $this->bulkProducts($vendor->id, $category->id, $productsToCreate);
        $userIds = $this->bulkUsers($usersToCreate);
        if ($userIds === []) {
            $userIds = User::query()->limit(500)->pluck('id')->all();
        }
        $productIds = Product::query()->where('status', ProductStatus::Active)->pluck('id')->all();
        $addressMap = $this->bulkAddresses($userIds);

        if ($ordersToCreate > 0 && $userIds !== [] && $productIds !== [] && $addressMap !== []) {
            $this->bulkOrders($ordersToCreate, $userIds, $productIds, $vendor->id, $itemsPerOrder, $addressMap);
        }

        $targetAnalytics = min(100000, 1000 * $scale);
        $existingAnalytics = DB::table('analytics_events')->count();
        $this->bulkAnalyticsEvents(max(0, $targetAnalytics - $existingAnalytics));

        $targetNotifications = min(20000, 100 * $scale);
        $existingNotifications = DB::table('user_notifications')->count();
        $this->bulkNotifications(max(0, $targetNotifications - $existingNotifications), $userIds);
    }

    private function bulkProducts(string $vendorId, string $categoryId, int $count): void
    {
        if ($count <= 0) {
            return;
        }

        $batch = 500;
        $now = now();
        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $rows = [];
            $inventory = [];
            for ($i = 0; $i < $chunk; $i++) {
                $id = (string) Str::uuid();
                $slug = 'perf-product-'.($offset + $i).'-'.Str::random(6);
                $rows[] = [
                    'id' => $id,
                    'vendor_account_id' => $vendorId,
                    'category_id' => $categoryId,
                    'name' => 'Perf Product '.($offset + $i),
                    'slug' => $slug,
                    'description' => 'Performance seed product',
                    'sale_price' => random_int(100, 5000),
                    'product_type' => ProductType::Single->value,
                    'status' => ProductStatus::Active->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
                $inventory[] = [
                    'id' => (string) Str::uuid(),
                    'product_id' => $id,
                    'stock_quantity' => 100,
                    'reserved_quantity' => 0,
                    'available_quantity' => 100,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('products')->insert($rows);
            DB::table('product_inventory')->insert($inventory);
        }
    }

    /**
     * @return list<string>
     */
    private function bulkUsers(int $count): array
    {
        if ($count <= 0) {
            return User::query()->limit(100)->pluck('id')->all();
        }

        $ids = [];
        $batch = 500;
        $now = now();
        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $rows = [];
            for ($i = 0; $i < $chunk; $i++) {
                $id = (string) Str::uuid();
                $ids[] = $id;
                $phone = '96659'.str_pad((string) (1000000 + $offset + $i), 7, '0', STR_PAD_LEFT);
                $rows[] = [
                    'id' => $id,
                    'name' => 'Perf User '.($offset + $i),
                    'email' => 'perf-user-'.($offset + $i).'@perf.local',
                    'phone' => $phone,
                    'password' => bcrypt('unused-perf-seed'),
                    'status' => UserStatus::Active->value,
                    'email_verified_at' => $now,
                    'phone_verified_at' => $now,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('users')->insert($rows);
        }

        return array_merge(User::query()->limit(100)->pluck('id')->all(), $ids);
    }

    /**
     * @param  list<string>  $userIds
     * @return array<string, string> user_id => address_id
     */
    private function bulkAddresses(array $userIds): array
    {
        if ($userIds === [] || ! DB::getSchemaBuilder()->hasTable('addresses')) {
            return [];
        }

        $map = [];
        $existing = DB::table('addresses')->whereIn('user_id', $userIds)->pluck('id', 'user_id');
        foreach ($existing as $userId => $addressId) {
            $map[(string) $userId] = (string) $addressId;
        }

        $missing = array_values(array_filter($userIds, fn (string $id) => ! isset($map[$id])));
        if ($missing === []) {
            return $map;
        }

        $batch = 500;
        $now = now();
        for ($offset = 0; $offset < count($missing); $offset += $batch) {
            $slice = array_slice($missing, $offset, $batch);
            $rows = [];
            foreach ($slice as $userId) {
                $addressId = (string) Str::uuid();
                $map[$userId] = $addressId;
                $rows[] = [
                    'id' => $addressId,
                    'user_id' => $userId,
                    'label' => 'Perf',
                    'type' => 'shipping',
                    'recipient_name' => 'Perf User',
                    'phone' => '966500000000',
                    'city' => 'Riyadh',
                    'district' => 'Al Olaya',
                    'street' => 'Perf Street',
                    'is_default' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
            DB::table('addresses')->insert($rows);
        }

        return $map;
    }

    /**
     * @param  list<string>  $userIds
     * @param  list<string>  $productIds
     * @param  array<string, string>  $addressMap
     */
    private function bulkOrders(int $count, array $userIds, array $productIds, string $vendorId, int $itemsPerOrder, array $addressMap): void
    {
        $batch = 100;
        $now = now();
        $orderNumberBase = (int) DB::table('orders')->count();
        $productCount = count($productIds);
        $productNames = Product::query()->whereIn('id', array_slice($productIds, 0, 100))->pluck('name', 'id');

        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $orders = [];
            $vendorOrders = [];
            $items = [];

            for ($i = 0; $i < $chunk; $i++) {
                $orderId = (string) Str::uuid();
                $userId = $userIds[($offset + $i) % count($userIds)];
                $addressId = $addressMap[$userId] ?? reset($addressMap);
                if ($addressId === false) {
                    continue;
                }
                $orderNumber = 'PERF-'.str_pad((string) ($orderNumberBase + $offset + $i + 1), 8, '0', STR_PAD_LEFT);
                $subtotal = random_int(100, 5000);
                $vat = round($subtotal * 0.15, 2);
                $shipping = 50;
                $grand = round($subtotal + $vat + $shipping, 2);
                $orders[] = [
                    'id' => $orderId,
                    'user_id' => $userId,
                    'order_number' => $orderNumber,
                    'status' => OrderStatus::Completed->value,
                    'shipping_address_id' => $addressId,
                    'shipping_recipient_name' => 'Perf User',
                    'shipping_phone' => '966500000000',
                    'shipping_city' => 'Riyadh',
                    'subtotal' => $subtotal,
                    'shipping_total' => $shipping,
                    'assembly_total' => 0,
                    'discount_total' => 0,
                    'vat_amount' => $vat,
                    'grand_total' => $grand,
                    'created_at' => $now->copy()->subDays(random_int(0, 90)),
                    'updated_at' => $now,
                ];

                $vendorOrderId = (string) Str::uuid();
                $vendorOrders[] = [
                    'id' => $vendorOrderId,
                    'order_id' => $orderId,
                    'vendor_account_id' => $vendorId,
                    'status' => OrderStatus::Completed->value,
                    'subtotal' => $subtotal,
                    'shipping_method' => 'standard',
                    'shipping_cost' => $shipping,
                    'assembly_cost' => 0,
                    'discount_amount' => 0,
                    'vat_amount' => $vat,
                    'vendor_total' => $grand,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                for ($j = 0; $j < $itemsPerOrder; $j++) {
                    $productId = $productIds[($offset + $i + $j) % $productCount];
                    $qty = random_int(1, 3);
                    $unit = random_int(50, 500);
                    $items[] = [
                        'id' => (string) Str::uuid(),
                        'vendor_order_id' => $vendorOrderId,
                        'product_id' => $productId,
                        'product_name' => $productNames[$productId] ?? 'Perf Product',
                        'product_slug' => 'perf-product',
                        'quantity' => $qty,
                        'unit_price' => $unit,
                        'line_subtotal' => $unit * $qty,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            if ($orders !== []) {
                DB::table('orders')->insert($orders);
                DB::table('vendor_orders')->insert($vendorOrders);
                DB::table('order_items')->insert($items);
            }
        }
    }

    private function bulkAnalyticsEvents(int $count): void
    {
        if ($count <= 0 || ! DB::getSchemaBuilder()->hasTable('analytics_events')) {
            return;
        }

        $batch = 1000;
        $types = ['product_view', 'search', 'add_to_cart', 'checkout_start'];
        $now = now();
        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $rows = [];
            for ($i = 0; $i < $chunk; $i++) {
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'event_type' => $types[($offset + $i) % count($types)],
                    'payload' => json_encode(['seed' => 'perf', 'i' => $offset + $i]),
                    'created_at' => $now->copy()->subMinutes(random_int(0, 43200)),
                ];
            }
            DB::table('analytics_events')->insert($rows);
        }
    }

    /**
     * @param  list<string>  $userIds
     */
    private function bulkNotifications(int $count, array $userIds): void
    {
        if ($count <= 0 || $userIds === [] || ! DB::getSchemaBuilder()->hasTable('user_notifications')) {
            return;
        }

        $batch = 500;
        $now = now();
        $dedupeBase = (int) DB::table('user_notifications')->count();
        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $rows = [];
            for ($i = 0; $i < $chunk; $i++) {
                $idx = $offset + $i;
                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'user_id' => $userIds[$idx % count($userIds)],
                    'type' => 'perf_seed',
                    'title' => 'Perf notification',
                    'body' => 'Performance seed notification',
                    'dedupe_key' => 'perf-'.($dedupeBase + $idx),
                    'read_at' => $idx % 3 === 0 ? $now : null,
                    'created_at' => $now->copy()->subMinutes(random_int(0, 10000)),
                    'updated_at' => $now,
                ];
            }
            DB::table('user_notifications')->insert($rows);
        }
    }
}
