<?php

namespace Tests\Feature\Infrastructure;

use App\Services\Infrastructure\PhpRuntimeValidator;
use Tests\TestCase;

class PhpRuntimeValidatorTest extends TestCase
{
    public function test_bcmath_is_required_and_available_in_test_runtime(): void
    {
        $validator = app(PhpRuntimeValidator::class);

        $this->assertTrue(
            extension_loaded('bcmath'),
            'PHPUnit runtime must have bcmath — production deploy uses diyar:validate-php-runtime',
        );

        $validator->assertProductionReady();
        $this->assertSame([], $validator->missingRequired());
    }

    public function test_snapshot_includes_bcmath_flag(): void
    {
        $snapshot = app(PhpRuntimeValidator::class)->snapshot();

        $this->assertTrue($snapshot['bcmath_available']);
        $this->assertContains('bcmath', $snapshot['required']);
    }
}
