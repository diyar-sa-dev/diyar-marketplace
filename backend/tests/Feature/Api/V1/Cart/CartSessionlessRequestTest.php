<?php

namespace Tests\Feature\Api\V1\Cart;

use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class CartSessionlessRequestTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function sessionless_request_without_origin_returns_unauthorized_instead_of_server_error(): void
    {
        $response = $this->withHeaders([
            'Accept' => 'application/json',
        ])->getJson('/api/v1/cart');

        $response->assertStatus(401);
        $response->assertJson([
            'message' => __('diyar.cart.invalid_session'),
        ]);
    }

    #[Test]
    public function sessionless_request_with_guest_token_resolves_cart(): void
    {
        $response = $this->withHeaders([
            'Accept' => 'application/json',
            'X-Guest-Cart-Token' => 'guest-test-uuid-12345',
        ])->getJson('/api/v1/cart');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'success',
            'data' => [
                'cart' => [
                    'id',
                    'status',
                    'item_count',
                    'items',
                ],
            ],
        ]);
    }
}
