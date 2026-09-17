<?php

namespace Tests\Unit\Services\Security;

use App\Services\Security\TwoFactorChallengeStore;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class TwoFactorChallengeStoreTest extends TestCase
{
    public function test_create_invalidates_previous_user_challenge(): void
    {
        Cache::flush();

        $store = app(TwoFactorChallengeStore::class);
        $first = $store->create('user-1', false);
        $second = $store->create('user-1', true);

        $this->assertNotSame($first, $second);
        $this->assertNull($store->peek($first));
        $this->assertNotNull($store->peek($second));
    }

    public function test_consume_is_single_use(): void
    {
        Cache::flush();

        $store = app(TwoFactorChallengeStore::class);
        $challengeId = $store->create('user-2', false);

        $first = $store->consume($challengeId);
        $second = $store->consume($challengeId);

        $this->assertSame('user-2', $first['user_id'] ?? null);
        $this->assertNull($second);
        $this->assertNull($store->peek($challengeId));
    }
}
