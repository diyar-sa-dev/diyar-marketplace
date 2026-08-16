<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\AvailabilityMode;
use App\Models\Category;
use App\Models\Product;
use App\Models\VendorAccount;
use Database\Seeders\CatalogSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductFilterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RoleSeeder::class);
        $this->seed(CategorySeeder::class);
        $this->seed(CatalogSeeder::class);
    }

    public function test_products_can_be_filtered_by_discounted_flag(): void
    {
        $response = $this->getJson('/api/v1/products?discounted=true&per_page=50');

        $response->assertOk();
        $items = $response->json('data.items');
        $this->assertNotEmpty($items);

        foreach ($items as $item) {
            $this->assertNotNull($item['compare_price']);
            $this->assertGreaterThan((float) $item['sale_price'], (float) $item['compare_price']);
        }
    }

    public function test_products_can_be_sorted_by_created_at_desc(): void
    {
        $response = $this->getJson('/api/v1/products?sort=-created_at&per_page=3');

        $response->assertOk()->assertJsonCount(3, 'data.items');
    }

    public function test_products_can_be_filtered_by_availability_mode(): void
    {
        $this->getJson('/api/v1/products?availability_mode=preorder')
            ->assertOk()
            ->assertJsonPath('data.items.0.availability_mode', AvailabilityMode::Preorder->value);
    }

    public function test_products_can_be_filtered_by_vendor_id(): void
    {
        $vendor = VendorAccount::query()->where('slug', 'rawae-al-khashab')->firstOrFail();

        $response = $this->getJson('/api/v1/products?vendor_id='.$vendor->id);

        $response->assertOk();
        foreach ($response->json('data.items') as $item) {
            $this->assertSame('rawae-al-khashab', $item['vendor']['slug']);
        }
    }

    public function test_products_pagination_returns_second_page(): void
    {
        $first = $this->getJson('/api/v1/products?per_page=5&page=1')->json('data.pagination');
        $second = $this->getJson('/api/v1/products?per_page=5&page=2')->json('data.pagination');

        $this->assertSame(2, $second['current_page']);
        $this->assertGreaterThan(5, $first['total']);
    }

    public function test_categories_can_be_filtered_by_type(): void
    {
        $response = $this->getJson('/api/v1/categories?type=service');

        $response->assertOk();
        $categories = $response->json('data.categories');
        $this->assertCount(10, $categories);
        $this->assertSame('interior-design', $categories[0]['slug']);
    }

    public function test_vendors_directory_lists_active_vendors_with_product_counts(): void
    {
        $response = $this->getJson('/api/v1/vendors?per_page=10');

        $response->assertOk()
            ->assertJsonPath('data.pagination.total', 6);

        $diyar = collect($response->json('data.items'))->firstWhere('slug', 'diyar-furniture');
        $this->assertNotNull($diyar);
        $this->assertGreaterThan(5, $diyar['product_count']);

        $emptyVendor = collect($response->json('data.items'))->firstWhere('slug', 'bayt-al-tasmim');
        $this->assertSame(0, $emptyVendor['product_count']);
    }

    public function test_archived_products_are_hidden_from_public_list(): void
    {
        $product = Product::query()->firstOrFail();
        $product->forceFill(['status' => 'archived'])->save();
        $product->delete();

        $this->getJson('/api/v1/products?per_page=100')
            ->assertOk()
            ->assertJsonMissing(['id' => $product->id]);
    }

    public function test_category_slug_filter_on_products_endpoint(): void
    {
        $category = Category::query()->where('slug', 'bedroom')->firstOrFail();

        $response = $this->getJson('/api/v1/products?category_slug=bedroom&per_page=50');

        $response->assertOk();
        foreach ($response->json('data.items') as $item) {
            $this->assertSame('bedroom', $item['category']['slug']);
        }

        $this->assertGreaterThan(0, count($response->json('data.items')));
    }
}
