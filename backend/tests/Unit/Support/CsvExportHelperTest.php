<?php

namespace Tests\Unit\Support;

use App\Support\Export\CsvExportHelper;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CsvExportHelperTest extends TestCase
{
    #[Test]
    public function it_neutralizes_formula_injection_prefixes(): void
    {
        $this->assertSame("'=1+1", CsvExportHelper::sanitizeCell('=1+1'));
        $this->assertSame("'+123", CsvExportHelper::sanitizeCell('+123'));
        $this->assertSame("'-5", CsvExportHelper::sanitizeCell('-5'));
        $this->assertSame("'@SUM(A1)", CsvExportHelper::sanitizeCell('@SUM(A1)'));
    }

    #[Test]
    public function it_leaves_safe_values_unchanged(): void
    {
        $this->assertSame('ORD-1001', CsvExportHelper::sanitizeCell('ORD-1001'));
        $this->assertSame('150.00', CsvExportHelper::sanitizeCell('150.00'));
    }
}
