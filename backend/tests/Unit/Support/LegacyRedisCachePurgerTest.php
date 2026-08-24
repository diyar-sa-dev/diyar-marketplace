<?php

namespace Tests\Unit\Support;

use App\Support\Cache\LegacyRedisCachePurger;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class LegacyRedisCachePurgerTest extends TestCase
{
    public function test_purge_category_trees_removes_corrupt_serialized_objects(): void
    {
        Cache::flush();

        Cache::put('diyar:catalog:categories:tree:product', new \stdClass, 60);

        $result = LegacyRedisCachePurger::purgeCategoryTrees();

        $this->assertContains('diyar:catalog:categories:tree:product', $result['purged']);
        $this->assertContains('diyar:catalog:categories:tree:product', $result['corrupt']);
        $this->assertNull(Cache::get('diyar:catalog:categories:tree:product'));
    }
}
