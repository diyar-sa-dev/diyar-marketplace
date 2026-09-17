<?php

namespace Tests\Unit\Support\VisualSearch;

use App\Support\VisualSearch\Dhash64Generator;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualSearchConfigTest extends TestCase
{
    #[Test]
    public function dhash_generator_is_bound_from_config(): void
    {
        config(['diyar.visual_search.working_dimension_px' => 256]);
        $this->assertInstanceOf(Dhash64Generator::class, app(Dhash64Generator::class));
    }

    #[Test]
    public function min_similarity_and_max_hamming_are_configured(): void
    {
        $this->assertSame(0.70, (float) config('diyar.visual_search.min_similarity'));
        $this->assertSame(19, (int) config('diyar.visual_search.max_hamming_distance'));
    }

    #[Test]
    public function visual_search_feature_flags_exist(): void
    {
        $this->assertNotNull(config('diyar.feature.visual_search_enabled'));
        $this->assertNotNull(config('diyar.visual_search.enabled'));
    }
}
