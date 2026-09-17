<?php

namespace Tests\Unit\Support\Cache;

use App\Support\Cache\CacheKeys;
use Illuminate\Support\Facades\Cache;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CacheKeysVisualSearchTest extends TestCase
{
    #[Test]
    public function visual_search_cache_key_includes_tuning_parameters(): void
    {
        Cache::flush();
        $key = CacheKeys::visualSearchResult('fingerprint-test');

        $this->assertStringContainsString('19', $key);
        $this->assertStringContainsString('0.7', $key);
        $this->assertStringContainsString('fingerprint-test', $key);
    }
}
