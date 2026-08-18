<?php

namespace Tests\Feature\Api\V1\Catalog;

use App\Enums\RoleName;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Concerns\InteractsWithCheckout;
use Tests\Concerns\InteractsWithDeliveredOrders;
use Tests\Concerns\InteractsWithFinance;
use Tests\Concerns\InteractsWithIdentity;
use Tests\Concerns\InteractsWithPayments;
use Tests\TestCase;

class ProductReviewIntegrityTest extends TestCase
{
    use InteractsWithCheckout, InteractsWithDeliveredOrders, InteractsWithFinance, InteractsWithIdentity, InteractsWithPayments, RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedCommissionRules();
        $this->fakePaymentGateway();
    }

    public function test_customer_cannot_review_unpurchased_product(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $product = Product::factory()->create();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 5,
        ])->assertForbidden();
    }

    public function test_customer_can_review_verified_purchase(): void
    {
        [$customer, , , $product] = $this->deliverSingleItemOrder();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 5,
            'comment' => 'Great quality',
        ])->assertOk();
    }

    public function test_vendor_cannot_review_own_product(): void
    {
        [$customer, $vendor, , $product] = $this->deliverSingleItemOrder();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $vendor, [
            'rating' => 5,
        ])->assertForbidden();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 4,
        ])->assertOk();
    }

    public function test_duplicate_product_review_returns_conflict(): void
    {
        [$customer, , , $product] = $this->deliverSingleItemOrder();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 5,
        ])->assertOk();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 4,
        ])->assertStatus(409);
    }

    public function test_owner_can_edit_and_delete_own_review(): void
    {
        [$customer, , , $product] = $this->deliverSingleItemOrder();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 4,
            'comment' => 'Good',
        ])->assertOk();

        $this->patchJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 5,
            'comment' => 'Updated',
        ])->assertOk()
            ->assertJsonPath('data.review.rating', 5);

        $this->deleteJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer)
            ->assertOk();

        $this->assertDatabaseMissing('product_reviews', [
            'user_id' => $customer->id,
            'product_id' => $product->id,
        ]);
    }

    public function test_user_cannot_delete_review_for_product_they_did_not_review(): void
    {
        [$customer, , , $product] = $this->deliverSingleItemOrder();
        $other = $this->createUserWithRole(RoleName::Customer);

        ProductReview::query()->create([
            'user_id' => $customer->id,
            'product_id' => $product->id,
            'rating' => 5,
        ]);

        $this->deleteJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $other)
            ->assertStatus(422);
    }

    public function test_whitespace_only_product_comment_is_rejected(): void
    {
        [$customer, , , $product] = $this->deliverSingleItemOrder();

        $this->postJsonAsUser('/api/v1/products/'.$product->id.'/reviews', $customer, [
            'rating' => 5,
            'comment' => '   ',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['comment']);
    }
}
