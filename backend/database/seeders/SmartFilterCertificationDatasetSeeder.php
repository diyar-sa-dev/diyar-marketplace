<?php

namespace Database\Seeders;

use App\Enums\AvailabilityMode;
use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Enums\ProviderAccountStatus;
use App\Enums\ServiceBookingMode;
use App\Enums\ServicePricingMode;
use App\Enums\UserStatus;
use App\Enums\VendorAccountStatus;
use App\Models\Category;
use App\Models\ProviderAccount;
use App\Models\ServiceCategory;
use App\Models\VendorAccount;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Phase 8 — Realistic catalog dataset for Smart Filter certification.
 *
 * Env:
 *   DIYAR_CERT_PRODUCTS=100000
 *   DIYAR_CERT_SERVICES=100000
 *   DIYAR_CERT_SEED=42
 *
 * Run after CategorySeeder + ServiceMarketplaceSeeder on isolated staging DB.
 */
class SmartFilterCertificationDatasetSeeder extends Seeder
{
    private int $seed = 42;

    /** @var list<string> */
    private array $categoryIds = [];

    /** @var list<string> */
    private array $vendorIds = [];

    /** @var list<string> */
    private array $serviceCategoryIds = [];

    /** @var list<string> */
    private array $providerIds = [];

    /** @var list<array{name: string, hex: string}> */
    private array $colorPalette = [
        ['name' => 'أبيض', 'hex' => '#FFFFFF'],
        ['name' => 'رمادي', 'hex' => '#9CA3AF'],
        ['name' => 'بني', 'hex' => '#8B4513'],
        ['name' => 'أسود', 'hex' => '#111827'],
        ['name' => 'بيج', 'hex' => '#F5F5DC'],
        ['name' => 'خشبي', 'hex' => '#8B7355'],
        ['name' => 'ذهبي', 'hex' => '#D4AF37'],
        ['name' => 'أزرق', 'hex' => '#2563EB'],
    ];

    /** @var list<string> */
    private array $materials = ['خشب', 'معدن', 'زجاج', 'قماش', 'جلد', 'رخام'];

    /** @var list<string> */
    private array $locations = ['الرياض', 'جدة', 'الدمام', 'مكة', 'المدينة', 'الخبر', 'تبوك'];

    public function run(): void
    {
        if (app()->environment('production')) {
            return;
        }

        $this->seed = max(1, (int) env('DIYAR_CERT_SEED', 42));
        mt_srand($this->seed);

        $targetProducts = max(0, (int) env('DIYAR_CERT_PRODUCTS', 100_000));
        $targetServices = max(0, (int) env('DIYAR_CERT_SERVICES', 100_000));

        $this->categoryIds = Category::query()->where('is_active', true)->pluck('id')->all();
        $this->serviceCategoryIds = ServiceCategory::query()->where('is_active', true)->pluck('id')->all();

        if ($this->categoryIds === [] || $this->serviceCategoryIds === []) {
            $this->command?->warn('SmartFilterCertificationDatasetSeeder: missing categories — run CategorySeeder + ServiceMarketplaceSeeder first.');

            return;
        }

        $this->ensureVendors(20);
        $this->ensureProviders(15);

        $existingProducts = (int) DB::table('products')->count();
        $existingServices = (int) DB::table('services')->count();

        $productsToCreate = max(0, $targetProducts - $existingProducts);
        $servicesToCreate = max(0, $targetServices - $existingServices);

        $this->command?->info(sprintf(
            'SmartFilterCertificationDatasetSeeder seed=%d: +%d products, +%d services (targets %d/%d)',
            $this->seed,
            $productsToCreate,
            $servicesToCreate,
            $targetProducts,
            $targetServices,
        ));

        if ($productsToCreate > 0) {
            $this->bulkProducts($productsToCreate);
        }

        if ($servicesToCreate > 0) {
            $this->bulkServices($servicesToCreate);
        }

        $this->command?->info(sprintf(
            'Final counts: products=%d services=%d vendors=%d providers=%d',
            DB::table('products')->count(),
            DB::table('services')->count(),
            count($this->vendorIds),
            count($this->providerIds),
        ));
    }

    private function ensureVendors(int $count): void
    {
        $existing = VendorAccount::query()->pluck('id')->all();
        $this->vendorIds = $existing;

        $needed = max(0, $count - count($existing));
        if ($needed === 0) {
            return;
        }

        $now = now();
        for ($i = 0; $i < $needed; $i++) {
            $userId = (string) Str::uuid();
            $vendorId = (string) Str::uuid();
            $slug = 'cert-vendor-'.(count($existing) + $i);

            DB::table('users')->insert([
                'id' => $userId,
                'name' => 'Cert Vendor '.(count($existing) + $i),
                'email' => 'cert-vendor-'.(count($existing) + $i).'@cert.local',
                'phone' => '96658'.str_pad((string) (100000 + $i), 7, '0', STR_PAD_LEFT),
                'password' => bcrypt('cert-seed-unused'),
                'status' => UserStatus::Active->value,
                'email_verified_at' => $now,
                'phone_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('vendor_accounts')->insert([
                'id' => $vendorId,
                'user_id' => $userId,
                'business_name' => 'Cert Vendor '.(count($existing) + $i),
                'slug' => $slug,
                'status' => VendorAccountStatus::Active->value,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->vendorIds[] = $vendorId;
        }
    }

    private function ensureProviders(int $count): void
    {
        $existing = ProviderAccount::query()->pluck('id')->all();
        $this->providerIds = $existing;

        $needed = max(0, $count - count($existing));
        if ($needed === 0) {
            return;
        }

        $now = now();
        for ($i = 0; $i < $needed; $i++) {
            $userId = (string) Str::uuid();
            $providerId = (string) Str::uuid();
            $slug = 'cert-provider-'.(count($existing) + $i);

            DB::table('users')->insert([
                'id' => $userId,
                'name' => 'Cert Provider '.(count($existing) + $i),
                'email' => 'cert-provider-'.(count($existing) + $i).'@cert.local',
                'phone' => '96657'.str_pad((string) (100000 + $i), 7, '0', STR_PAD_LEFT),
                'password' => bcrypt('cert-seed-unused'),
                'status' => UserStatus::Active->value,
                'email_verified_at' => $now,
                'phone_verified_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            DB::table('provider_accounts')->insert([
                'id' => $providerId,
                'user_id' => $userId,
                'business_name' => 'Cert Provider '.(count($existing) + $i),
                'slug' => $slug,
                'status' => ProviderAccountStatus::Active->value,
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            $this->providerIds[] = $providerId;
        }
    }

    private function bulkProducts(int $count): void
    {
        $batch = 500;
        $now = now();
        $vendorCount = count($this->vendorIds);
        $categoryCount = count($this->categoryIds);

        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $products = [];
            $inventory = [];
            $colors = [];

            for ($i = 0; $i < $chunk; $i++) {
                $index = $offset + $i;
                $id = (string) Str::uuid();
                $vendorIdx = $this->zipfIndex($vendorCount, $index);
                $categoryIdx = $this->zipfIndex($categoryCount, $index + 17);
                $salePrice = $this->skewedPrice($index);
                $discounted = ($index % 5) === 0;
                $comparePrice = $discounted ? round($salePrice * 1.15, 2) : null;
                $availability = match ($index % 13) {
                    0 => AvailabilityMode::OutOfStock->value,
                    1, 2 => AvailabilityMode::Preorder->value,
                    default => AvailabilityMode::InStock->value,
                };

                $products[] = [
                    'id' => $id,
                    'vendor_account_id' => $this->vendorIds[$vendorIdx],
                    'category_id' => $this->categoryIds[$categoryIdx],
                    'name' => 'Cert Product '.$index,
                    'slug' => 'cert-product-'.$index,
                    'description' => 'Phase 8 certification product',
                    'sale_price' => $salePrice,
                    'compare_price' => $comparePrice,
                    'promotion_ends_at' => $discounted ? $now->copy()->addDays(30) : null,
                    'materials' => json_encode([
                        'main' => $this->materials[$index % count($this->materials)],
                        'secondary' => $this->materials[($index + 2) % count($this->materials)],
                    ]),
                    'product_type' => ProductType::Single->value,
                    'availability_mode' => $availability,
                    'status' => ProductStatus::Active->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $inventory[] = [
                    'id' => (string) Str::uuid(),
                    'product_id' => $id,
                    'stock_quantity' => $availability === AvailabilityMode::OutOfStock->value ? 0 : random_int(1, 200),
                    'reserved_quantity' => 0,
                    'available_quantity' => $availability === AvailabilityMode::OutOfStock->value ? 0 : random_int(1, 200),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($index % 3 !== 2) {
                    $color = $this->colorPalette[$index % count($this->colorPalette)];
                    $colors[] = [
                        'id' => (string) Str::uuid(),
                        'product_id' => $id,
                        'name' => $color['name'],
                        'hex_code' => $color['hex'],
                        'created_at' => $now,
                        'updated_at' => $now,
                    ];
                }
            }

            DB::table('products')->insert($products);
            if ($inventory !== [] && DB::getSchemaBuilder()->hasTable('product_inventory')) {
                DB::table('product_inventory')->insert($inventory);
            }
            if ($colors !== []) {
                DB::table('product_colors')->insert($colors);
            }

            if ($offset > 0 && $offset % 5000 === 0) {
                $this->command?->info("  products: {$offset}/{$count}");
            }
        }
    }

    private function bulkServices(int $count): void
    {
        $batch = 500;
        $now = now();
        $providerCount = count($this->providerIds);
        $categoryCount = count($this->serviceCategoryIds);
        $pricingModes = [
            ServicePricingMode::Fixed->value,
            ServicePricingMode::StartingFrom->value,
            ServicePricingMode::Hourly->value,
            ServicePricingMode::PerSqm->value,
            ServicePricingMode::PerProject->value,
            ServicePricingMode::CustomQuote->value,
        ];

        for ($offset = 0; $offset < $count; $offset += $batch) {
            $chunk = min($batch, $count - $offset);
            $rows = [];

            for ($i = 0; $i < $chunk; $i++) {
                $index = $offset + $i;
                $providerIdx = $this->zipfIndex($providerCount, $index);
                $categoryIdx = $this->zipfIndex($categoryCount, $index + 11);
                $rating = round(2.5 + (($index % 50) / 10), 2);

                $rows[] = [
                    'id' => (string) Str::uuid(),
                    'provider_account_id' => $this->providerIds[$providerIdx],
                    'service_category_id' => $this->serviceCategoryIds[$categoryIdx],
                    'title' => 'Cert Service '.$index,
                    'slug' => 'cert-service-'.$index,
                    'description' => 'Phase 8 certification service',
                    'pricing_mode' => $pricingModes[$index % count($pricingModes)],
                    'booking_mode' => ServiceBookingMode::Request->value,
                    'starting_price' => $this->skewedPrice($index + 1000),
                    'currency' => 'SAR',
                    'location' => $this->locations[$index % count($this->locations)],
                    'remote_available' => ($index % 4) !== 0,
                    'is_active' => true,
                    'requests_count' => $index % 500,
                    'rating_average' => min(5.0, $rating),
                    'reviews_count' => $index % 200,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('services')->insert($rows);

            if ($offset > 0 && $offset % 5000 === 0) {
                $this->command?->info("  services: {$offset}/{$count}");
            }
        }
    }

    private function zipfIndex(int $count, int $n): int
    {
        if ($count <= 1) {
            return 0;
        }

        $rank = (int) floor(pow(log($n + 2), 2)) % $count;

        return min($count - 1, max(0, $rank));
    }

    private function skewedPrice(int $index): float
    {
        $bucket = $index % 100;
        if ($bucket < 60) {
            return round(100 + ($index % 2000), 2);
        }
        if ($bucket < 90) {
            return round(2000 + ($index % 8000), 2);
        }

        return round(10000 + ($index % 40000), 2);
    }
}
