<?php

namespace Tests\Unit\Support\Security;

use App\Support\Security\SessionLookupHash;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class SessionLookupHashTest extends TestCase
{
    #[Test]
    public function it_produces_stable_deterministic_hashes(): void
    {
        $hashA = SessionLookupHash::make('session-id-123');
        $hashB = SessionLookupHash::make('session-id-123');
        $hashC = SessionLookupHash::make('session-id-456');

        $this->assertSame($hashA, $hashB);
        $this->assertNotSame($hashA, $hashC);
        $this->assertSame(64, strlen($hashA));
    }
}
