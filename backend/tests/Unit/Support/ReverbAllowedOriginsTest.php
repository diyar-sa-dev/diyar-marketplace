<?php

namespace Tests\Unit\Support;

use App\Support\Realtime\ReverbAllowedOrigins;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class ReverbAllowedOriginsTest extends TestCase
{
    #[Test]
    public function it_allows_all_origins_outside_production(): void
    {
        $this->assertSame(['*'], ReverbAllowedOrigins::resolve('local', [
            'https://diyar.sa',
        ]));
        $this->assertSame(['*'], ReverbAllowedOrigins::resolve('staging', []));
    }

    #[Test]
    public function it_keeps_configured_origins_in_production(): void
    {
        $this->assertSame(
            ['https://diyar.sa', 'https://www.diyar.sa'],
            ReverbAllowedOrigins::resolve('production', [
                'https://diyar.sa',
                ' https://www.diyar.sa ',
                '',
                null,
            ]),
        );
    }
}
