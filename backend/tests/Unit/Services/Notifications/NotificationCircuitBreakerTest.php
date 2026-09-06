<?php

namespace Tests\Unit\Services\Notifications;

use App\Enums\NotificationFailureCategory;
use App\Services\Notifications\NotificationCircuitBreaker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use RuntimeException;
use Tests\TestCase;

class NotificationCircuitBreakerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config([
            'diyar.notifications.circuit_breaker.failure_threshold' => 3,
            'diyar.notifications.circuit_breaker.cooldown_seconds' => 1,
        ]);
    }

    public function test_opens_after_threshold_failures(): void
    {
        $breaker = app(NotificationCircuitBreaker::class);

        $breaker->recordFailure('email');
        $breaker->recordFailure('email');
        $this->assertFalse($breaker->isOpen('email'));

        $breaker->recordFailure('email');
        $this->assertTrue($breaker->isOpen('email'));
    }

    public function test_success_resets_circuit(): void
    {
        $breaker = app(NotificationCircuitBreaker::class);

        for ($i = 0; $i < 3; $i++) {
            $breaker->recordFailure('email');
        }

        $breaker->recordSuccess('email');
        $this->assertFalse($breaker->isOpen('email'));
    }

    public function test_classifies_permanent_failures(): void
    {
        $breaker = app(NotificationCircuitBreaker::class);

        $category = $breaker->classifyFailure(new RuntimeException('Recipient has no email address.'));

        $this->assertSame(NotificationFailureCategory::InvalidRecipient, $category);
        $this->assertFalse($category->isRetryable());
    }

    public function test_transitions_to_half_open_after_cooldown(): void
    {
        $breaker = app(NotificationCircuitBreaker::class);

        for ($i = 0; $i < 3; $i++) {
            $breaker->recordFailure('email');
        }

        $this->assertTrue($breaker->isOpen('email'));

        $this->travel(2)->seconds();

        $breaker->assertAvailable('email');
        $this->assertFalse($breaker->isOpen('email'));
    }
}
