<?php

namespace App\Console\Commands;

use App\Enums\ProductStatus;
use App\Enums\ProductType;
use App\Models\Category;
use App\Models\Product;
use App\Models\VendorAccount;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ManageCardinalityCommand extends Command
{
    protected $signature = 'perf:cardinality 
                            {action=status : Action to perform: status|set|clean} 
                            {--count=1000 : Target total products (e.g. 1000, 10000)}';

    protected $description = 'Deterministic catalog cardinality manager for Phase 20.2 scaling benchmarks';

    public function handle(): int
    {
        $action = $this->argument('action');

        return match ($action) {
            'set' => $this->setCardinality((int) $this->option('count')),
            'clean' => $this->cleanCardinality(),
            default => $this->showStatus(),
        };
    }

    private function showStatus(): int
    {
        $total = DB::table('products')->count();
        $perf = DB::table('products')->where('slug', 'like', 'perf-cardinality-%')->count();
        $base = $total - $perf;
        $inv = DB::table('product_inventory')->count();
        $visible = Product::query()->publiclyVisible()->count();

        $this->info('Catalog Cardinality Status:');
        $this->line("  Base products:       {$base}");
        $this->line("  Synthetic products:  {$perf}");
        $this->line("  Total products:      {$total}");
        $this->line("  Publicly visible:    {$visible}");
        $this->line("  Inventory records:   {$inv}");

        return 0;
    }

    private function cleanCardinality(): int
    {
        $this->info('Cleaning synthetic cardinality products...');
        $syntheticIds = DB::table('products')
            ->where('slug', 'like', 'perf-cardinality-%')
            ->pluck('id')
            ->all();

        $count = count($syntheticIds);
        if ($count > 0) {
            foreach (array_chunk($syntheticIds, 1000) as $chunk) {
                DB::table('product_inventory')->whereIn('product_id', $chunk)->delete();
                DB::table('products')->whereIn('id', $chunk)->delete();
            }
        }

        Cache::flush();
        $this->info("Deleted {$count} synthetic products. Catalog cache flushed.");
        $this->showStatus();

        return 0;
    }

    private function setCardinality(int $targetTotal): int
    {
        $this->cleanCardinality();

        $baseCount = DB::table('products')->count();
        if ($targetTotal <= $baseCount) {
            $this->info("Target cardinality {$targetTotal} <= base count {$baseCount}. Nothing to add.");

            return 0;
        }

        $needed = $targetTotal - $baseCount;
        $this->info("Generating {$needed} deterministic synthetic products to reach {$targetTotal} total...");

        $vendors = VendorAccount::query()->where('status', 'active')->pluck('id')->all();
        if (empty($vendors)) {
            $this->error('No active vendor accounts found!');

            return 1;
        }

        $categories = Category::query()->where('is_active', true)->pluck('id')->all();
        if (empty($categories)) {
            $this->error('No active categories found!');

            return 1;
        }

        $vocabulary = [
            ['ar' => 'كنب مودرن فاخر', 'en' => 'Luxury Modern Sofa', 'tag' => 'sofa', 'kw' => 'كنب'],
            ['ar' => 'كرسي مريح لغرفة المعيشة', 'en' => 'Comfortable Living Room Chair', 'tag' => 'chair', 'kw' => 'كرسي'],
            ['ar' => 'طاولة طعام خشبية أنيقة', 'en' => 'Elegant Wooden Dining Table', 'tag' => 'table', 'kw' => 'طاولة'],
            ['ar' => 'سرير نوم مزدوج كينج', 'en' => 'King Size Bedroom Bed', 'tag' => 'bed', 'kw' => 'سرير'],
            ['ar' => 'خزانة ملابس عصرية بتصميم راقي', 'en' => 'Modern Wardrobe Interior Design', 'tag' => 'bedroom', 'kw' => 'تصميم'],
            ['ar' => 'مكتب دراسي خشبي للمنزل', 'en' => 'Home Study Wooden Desk Table', 'tag' => 'table', 'kw' => 'طاولة'],
            ['ar' => 'طقم كنب زاوية كبير', 'en' => 'Large Sectional Corner Sofa', 'tag' => 'sofa', 'kw' => 'كنب'],
            ['ar' => 'كرسي مكتب دوار ومريح', 'en' => 'Ergonomic Swivel Office Chair', 'tag' => 'chair', 'kw' => 'كرسي'],
        ];

        $batchSize = 1000;
        $now = now()->toDateTimeString();
        $startTime = microtime(true);

        for ($offset = 0; $offset < $needed; $offset += $batchSize) {
            $currentBatch = min($batchSize, $needed - $offset);
            $productRows = [];
            $inventoryRows = [];

            for ($i = 0; $i < $currentBatch; $i++) {
                $idx = $offset + $i + 1;
                $vocab = $vocabulary[$idx % count($vocabulary)];
                $catId = $categories[$idx % count($categories)];
                $vendorId = $vendors[$idx % count($vendors)];
                $id = (string) Str::uuid();

                $nameAr = "{$vocab['ar']} #{$idx}";
                $nameEn = "{$vocab['en']} #{$idx}";
                $desc = "{$vocab['ar']} - {$vocab['en']}. عالي الجودة ومناسب لكافة الديكورات العصرية. Design and comfort guaranteed.";
                $price = 100 + (($idx * 17) % 4900); // 100 - 5000 SAR

                $productRows[] = [
                    'id' => $id,
                    'vendor_account_id' => $vendorId,
                    'category_id' => $catId,
                    'name' => $nameAr,
                    'slug' => "perf-cardinality-prod-{$idx}",
                    'description' => $desc,
                    'sale_price' => $price,
                    'compare_price' => ($idx % 3 === 0) ? $price + 200 : null,
                    'product_type' => ProductType::Single->value,
                    'availability_mode' => 'in_stock',
                    'status' => ProductStatus::Active->value,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $inventoryRows[] = [
                    'id' => (string) Str::uuid(),
                    'product_id' => $id,
                    'stock_quantity' => 100,
                    'reserved_quantity' => 0,
                    'available_quantity' => 100,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            DB::table('products')->insert($productRows);
            DB::table('product_inventory')->insert($inventoryRows);
        }

        $duration = round(microtime(true) - $startTime, 2);
        Cache::flush();
        $this->info("Successfully generated {$needed} products in {$duration}s.");
        $this->showStatus();

        return 0;
    }
}
