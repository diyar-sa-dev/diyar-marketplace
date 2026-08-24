<?php

namespace Tests\Unit\Support;

use App\Models\Category;
use App\Support\Cache\EloquentTreeCache;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class EloquentTreeCacheTest extends TestCase
{
    use RefreshDatabase;

    public function test_remember_round_trips_nested_category_tree_through_redis_cache(): void
    {
        Cache::flush();

        $parent = Category::factory()->create(['slug' => 'living-room', 'name' => 'الصالونات']);
        Category::factory()->create([
            'parent_id' => $parent->id,
            'slug' => 'sofas',
            'name' => 'كنب',
        ]);

        $first = EloquentTreeCache::remember(
            'test:categories:tree',
            60,
            fn (): EloquentCollection => Category::query()
                ->roots()
                ->with(['children' => fn ($q) => $q->ordered()])
                ->ordered()
                ->get(),
            Category::class,
            ['children'],
        );

        $this->assertCount(1, $first);
        $this->assertSame('living-room', $first->first()?->slug);
        $this->assertCount(1, $first->first()?->children);

        $second = EloquentTreeCache::remember(
            'test:categories:tree',
            60,
            fn (): EloquentCollection => throw new \RuntimeException('resolver must not run on cache hit'),
            Category::class,
            ['children'],
        );

        $this->assertCount(1, $second);
        $this->assertSame('living-room', $second->first()?->slug);
        $this->assertCount(1, $second->first()?->children);
        $this->assertSame('sofas', $second->first()?->children->first()?->slug);
    }

    public function test_remember_rebuilds_when_cached_payload_is_stale(): void
    {
        Cache::flush();

        Cache::put('test:categories:tree:stale', ['legacy' => 'payload'], 60);

        $parent = Category::factory()->create(['slug' => 'bedroom', 'name' => 'غرف النوم']);

        $tree = EloquentTreeCache::remember(
            'test:categories:tree:stale',
            60,
            fn (): EloquentCollection => Category::query()->roots()->ordered()->get(),
            Category::class,
            ['children'],
        );

        $this->assertCount(1, $tree);
        $this->assertSame($parent->id, $tree->first()?->id);
    }

    public function test_remember_rebuilds_when_cached_payload_is_serialized_object(): void
    {
        Cache::flush();

        Cache::put('test:categories:tree:object', (object) ['broken' => true], 60);

        Category::factory()->create(['slug' => 'office', 'name' => 'المكاتب']);

        $tree = EloquentTreeCache::remember(
            'test:categories:tree:object',
            60,
            fn (): EloquentCollection => Category::query()->roots()->ordered()->get(),
            Category::class,
            ['children'],
        );

        $this->assertCount(1, $tree);
        $this->assertSame('office', $tree->first()?->slug);
    }
}
