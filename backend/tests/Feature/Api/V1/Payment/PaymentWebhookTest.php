<?php

namespace Tests\Feature\Api\V1\Payment;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\PaymentWebhookProcessingStatus;
use App\Enums\RoleName;
use App\Models\Address;
use App\Models\Order;
use App\Models\Payment;
use App\Models\PaymentWebhookEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function webhook_endpoint_returns_404_when_secret_not_configured(): void
    {
        config(['myfatoorah.webhook_secret_key' => '']);

        $this->postJson('/api/v1/webhooks/payments/myfatoorah', [])
            ->assertNotFound();
    }

    #[Test]
    public function webhook_rejects_invalid_payload(): void
    {
        config(['myfatoorah.webhook_secret_key' => 'test-secret']);

        $this->postJson('/api/v1/webhooks/payments/myfatoorah', ['invalid' => true])
            ->assertStatus(400);
    }

    #[Test]
    public function webhook_deduplicates_identical_payloads(): void
    {
        config(['myfatoorah.webhook_secret_key' => 'test-secret']);

        PaymentWebhookEvent::query()->create([
            'gateway' => 'myfatoorah',
            'event_type' => '1',
            'webhook_version' => 'v1',
            'signature_valid' => true,
            'payload_hash' => hash('sha256', '{"Data":{"InvoiceId":1}}'),
            'payload' => ['Data' => ['InvoiceId' => 1]],
            'processing_status' => PaymentWebhookProcessingStatus::Processed,
            'processed_at' => now(),
        ]);

        $this->postJson('/api/v1/webhooks/payments/myfatoorah', ['Data' => ['InvoiceId' => 1]])
            ->assertOk()
            ->assertJsonPath('data.duplicate', true);
    }
}

class PaymentAuthorizationTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function customer_can_view_own_order_payment(): void
    {
        $customer = $this->createUserWithRole(RoleName::Customer);
        $address = Address::factory()->create(['user_id' => $customer->id]);

        $order = Order::query()->create([
            'user_id' => $customer->id,
            'order_number' => 'DYR-20260817-000010',
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'shipping_building' => $address->building,
            'shipping_apartment' => $address->apartment,
            'subtotal' => '100.00',
            'shipping_total' => '28.00',
            'assembly_total' => '0.00',
            'discount_total' => '0.00',
            'vat_amount' => '19.20',
            'grand_total' => '147.20',
            'idempotency_key' => (string) Str::uuid(),
            'idempotency_payload_hash' => hash('sha256', 'test'),
        ]);

        Payment::query()->create([
            'order_id' => $order->id,
            'status' => PaymentStatus::Pending,
            'amount' => '147.20',
            'currency' => 'SAR',
            'payment_reference' => $order->order_number,
            'gateway' => 'myfatoorah',
        ]);

        $this->actingAs($customer)
            ->getJson('/api/v1/orders/'.$order->id.'/payment')
            ->assertOk()
            ->assertJsonPath('data.payment_reference', $order->order_number);
    }
}
