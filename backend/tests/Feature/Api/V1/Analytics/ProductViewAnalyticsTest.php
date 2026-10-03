<?php

namespace Tests\Feature\Api\V1\Analytics;

use App\Enums\AnalyticsEventType;
use App\Enums\RoleName;
use App\Domains\Analytics\Jobs\RecordAnalyticsEventJob;
use App\Models\AnalyticsEvent;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class ProductViewAnalyticsTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function product_show_records_product_viewed_event(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($customer)
            ->getJson("/api/v1/products/{$product->id}")
            ->assertOk();

        $this->assertDatabaseHas('analytics_events', [
            'event_type' => AnalyticsEventType::ProductViewed->value,
            'subject_type' => 'product',
            'subject_id' => $product->id,
            'user_id' => $customer->id,
            'vendor_account_id' => $product->vendor_account_id,
        ]);
    }

    #[Test]
    public function product_view_is_deduped_within_throttle_window(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($customer)->getJson("/api/v1/products/{$product->id}")->assertOk();
        $this->actingAs($customer)->getJson("/api/v1/products/{$product->id}")->assertOk();

        $this->assertSame(
            1,
            AnalyticsEvent::query()
                ->where('event_type', AnalyticsEventType::ProductViewed->value)
                ->where('subject_id', $product->id)
                ->count(),
        );
    }

    #[Test]
    public function product_view_skips_prefetch_requests(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($customer)
            ->withHeader('Purpose', 'prefetch')
            ->getJson("/api/v1/products/{$product->id}")
            ->assertOk();

        $this->assertDatabaseMissing('analytics_events', [
            'event_type' => AnalyticsEventType::ProductViewed->value,
            'subject_id' => $product->id,
        ]);
    }

    #[Test]
    public function product_show_dispatches_analytics_job_instead_of_blocking_on_insert(): void
    {
        Queue::fake();

        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->actingAs($customer)
            ->getJson("/api/v1/products/{$product->id}")
            ->assertOk();

        Queue::assertPushed(RecordAnalyticsEventJob::class, function (RecordAnalyticsEventJob $job) use ($customer, $product): bool {
            return $job->eventType === AnalyticsEventType::ProductViewed->value
                && $job->userId === $customer->id
                && $job->subjectType === 'product'
                && $job->subjectId === $product->id
                && $job->vendorAccountId === $product->vendor_account_id
                && ($job->payload['source'] ?? null) === 'product_detail';
        });

        $this->assertDatabaseCount('analytics_events', 0);
    }
}
